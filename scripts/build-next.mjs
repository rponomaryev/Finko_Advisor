import { spawnSync } from "node:child_process";

const env = {
  ...process.env,
  NEXT_SKIP_PRISMA_DURING_BUILD: "true",
  NEXT_TELEMETRY_DISABLED: "1",
  NODE_ENV: process.env.NODE_ENV || "production"
};

const isWindows = process.platform === "win32";
const command = isWindows ? "npx.cmd" : "npx";

const result = spawnSync(command, ["next", "build"], {
  stdio: "inherit",
  env,
  shell: isWindows
});

if (result.error) {
  console.error("Failed to start Next build:", result.error);
  process.exit(1);
}

if (result.signal) {
  console.error("Next build was terminated by signal:", result.signal);
  process.exit(1);
}

process.exit(result.status ?? 1);
