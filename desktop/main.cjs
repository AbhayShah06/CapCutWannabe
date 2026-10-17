const { app, BrowserWindow, dialog, net: electronNet, shell } = require("electron");
const { fork } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const net = require("node:net");

const RELEASES_URL = "https://github.com/AbhayShah06/CapCutWannabe/releases/latest";
const LATEST_RELEASE_API = "https://api.github.com/repos/AbhayShah06/CapCutWannabe/releases/latest";

let serverProcess;
let mainWindow;

function windowStatePath() {
  return path.join(app.getPath("userData"), "window-state.json");
}

function loadWindowState() {
  try {
    const state = JSON.parse(fs.readFileSync(windowStatePath(), "utf8"));
    if (![state.width, state.height].every(Number.isFinite)) return {};
    return {
      width: Math.max(1040, state.width),
      height: Math.max(700, state.height),
      ...(Number.isFinite(state.x) ? { x: state.x } : {}),
      ...(Number.isFinite(state.y) ? { y: state.y } : {}),
      maximized: Boolean(state.maximized),
    };
  } catch {
    return {};
  }
}

function saveWindowState(window) {
  if (!window || window.isDestroyed()) return;
  const bounds = window.getNormalBounds();
  fs.mkdirSync(app.getPath("userData"), { recursive: true });
  fs.writeFileSync(
    windowStatePath(),
    JSON.stringify({ ...bounds, maximized: window.isMaximized() }),
  );
}

function versionParts(version) {
  return version.replace(/^v/, "").split(".").map((part) => Number.parseInt(part, 10) || 0);
}

function isNewerVersion(candidate, current) {
  const next = versionParts(candidate);
  const installed = versionParts(current);
  for (let index = 0; index < Math.max(next.length, installed.length); index += 1) {
    if ((next[index] || 0) !== (installed[index] || 0)) {
      return (next[index] || 0) > (installed[index] || 0);
    }
  }
  return false;
}

async function checkForUpdates() {
  if (!app.isPackaged) return;
  try {
    const response = await electronNet.fetch(LATEST_RELEASE_API, {
      headers: { Accept: "application/vnd.github+json" },
    });
    if (!response.ok) return;
    const release = await response.json();
    if (!release.tag_name || !isNewerVersion(release.tag_name, app.getVersion())) return;
    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "CapCutWannabe update available",
      message: `Version ${release.tag_name.replace(/^v/, "")} is ready`,
      detail: "Download the newest installer from GitHub. Your local projects and app data will remain in place.",
      buttons: ["Download update", "Later"],
      defaultId: 0,
      cancelId: 1,
    });
    if (result.response === 0) await shell.openExternal(RELEASES_URL);
  } catch {
    // Editing must never be blocked by an unavailable update service.
  }
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.once("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      const port = typeof address === "object" && address ? address.port : 0;
      server.close((error) => (error ? reject(error) : resolve(port)));
    });
  });
}

function waitForServer(port, timeoutMs = 30_000) {
  const startedAt = Date.now();
  return new Promise((resolve, reject) => {
    const probe = () => {
      const socket = net.createConnection({ host: "127.0.0.1", port });
      socket.once("connect", () => {
        socket.destroy();
        resolve();
      });
      socket.once("error", () => {
        socket.destroy();
        if (Date.now() - startedAt >= timeoutMs) {
          reject(new Error("The local editor did not start in time."));
          return;
        }
        setTimeout(probe, 150);
      });
    };
    probe();
  });
}

function startServer(port) {
  const serverRoot = app.isPackaged
    ? path.join(process.resourcesPath, "server", "apps", "web")
    : path.join(__dirname, "..", "apps", "web", ".next", "standalone", "apps", "web");
  const serverFile = path.join(serverRoot, "server.js");

  serverProcess = fork(serverFile, [], {
    cwd: serverRoot,
    stdio: "ignore",
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: "1",
      NODE_ENV: "production",
      HOSTNAME: "127.0.0.1",
      PORT: String(port),
      NEXT_PUBLIC_SITE_URL: `http://127.0.0.1:${port}`,
      NEXT_PUBLIC_MARBLE_API_URL: "https://api.marblecms.com",
      DATABASE_URL: "postgresql://local:local@127.0.0.1:5432/local",
      BETTER_AUTH_SECRET: "capcutwannabe-local-desktop-runtime-only",
      UPSTASH_REDIS_REST_URL: "http://127.0.0.1:8079",
      UPSTASH_REDIS_REST_TOKEN: "offline",
      MARBLE_WORKSPACE_KEY: "offline",
      FREESOUND_CLIENT_ID: "offline",
      FREESOUND_API_KEY: "offline",
    },
  });
}

async function createWindow() {
  const port = await getFreePort();
  startServer(port);
  await waitForServer(port);

  const savedState = loadWindowState();

  mainWindow = new BrowserWindow({
	width: savedState.width || 1480,
	height: savedState.height || 940,
	...(Number.isFinite(savedState.x) ? { x: savedState.x } : {}),
	...(Number.isFinite(savedState.y) ? { y: savedState.y } : {}),
    minWidth: 1040,
    minHeight: 700,
    show: false,
    backgroundColor: "#090a0d",
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://127.0.0.1:")) return { action: "allow" };
    shell.openExternal(url);
    return { action: "deny" };
  });
  mainWindow.webContents.on("will-navigate", (event, url) => {
	if (!url.startsWith(`http://127.0.0.1:${port}`)) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  await mainWindow.loadURL(`http://127.0.0.1:${port}/projects`);
  mainWindow.once("ready-to-show", () => {
    if (savedState.maximized) mainWindow.maximize();
    mainWindow.show();
    void checkForUpdates();
  });
  mainWindow.on("close", () => saveWindowState(mainWindow));
}

const hasSingleInstanceLock = app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) app.quit();

app.on("second-instance", () => {
  if (!mainWindow) return;
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.focus();
});

app.whenReady().then(createWindow).catch((error) => {
  console.error(error);
	dialog.showErrorBox(
		"CapCutWannabe could not start",
		"The local editor failed to start. Restart the app. If the problem continues, install the latest release from GitHub.",
	);
  app.quit();
});

app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => {
  if (serverProcess && !serverProcess.killed) serverProcess.kill();
});
