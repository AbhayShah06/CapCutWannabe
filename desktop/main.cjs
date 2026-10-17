const { app, BrowserWindow, shell } = require("electron");
const { fork } = require("node:child_process");
const path = require("node:path");
const net = require("node:net");

let serverProcess;
let mainWindow;

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

  mainWindow = new BrowserWindow({
    width: 1480,
    height: 940,
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
  mainWindow.once("ready-to-show", () => mainWindow.show());
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
  app.quit();
});

app.on("window-all-closed", () => app.quit());
app.on("before-quit", () => {
  if (serverProcess && !serverProcess.killed) serverProcess.kill();
});
