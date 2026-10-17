import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  NEXT_PUBLIC_SITE_URL: "http://127.0.0.1:41739",
  NEXT_PUBLIC_MARBLE_API_URL: "https://api.marblecms.com",
  DATABASE_URL: "postgresql://local:local@127.0.0.1:5432/local",
  BETTER_AUTH_SECRET: "capcutwannabe-local-desktop-build-only",
  UPSTASH_REDIS_REST_URL: "http://127.0.0.1:8079",
  UPSTASH_REDIS_REST_TOKEN: "offline",
  MARBLE_WORKSPACE_KEY: "offline",
  FREESOUND_CLIENT_ID: "offline",
  FREESOUND_API_KEY: "offline",
};

const command = process.platform === "win32" ? "bun.exe" : "bun";
const result = spawnSync(command, ["run", "--cwd", "apps/web", "build"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

if (result.status !== 0) process.exit(result.status ?? 1);
