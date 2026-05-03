import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SUCCESS_EXIT_CODE = 0;
const FAILURE_EXIT_CODE = 1;
const FRONTEND_ARGS = ["run", "dev:frontend", "--", "--open"];
const BACKEND_ARGS = ["run", "dev"];
const NPM_COMMAND = process.platform === "win32" ? "npm.cmd" : "npm";
const scriptDir = dirname(fileURLToPath(import.meta.url));
const rootDir = join(scriptDir, "..");
const serverDir = join(rootDir, "server");

let shuttingDown = false;
const children = [];

function startProcess(name, cwd, args) {
  const child = spawn(NPM_COMMAND, args, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32",
  });

  child.on("error", (error) => {
    console.error(`[dev:all] ${name} failed to start:`, error);
    void shutdown(FAILURE_EXIT_CODE);
  });

  child.on("close", (code, signal) => {
    if (shuttingDown) {
      return;
    }

    const reason = signal ? `signal ${signal}` : `code ${code ?? "unknown"}`;
    console.error(`[dev:all] ${name} exited unexpectedly with ${reason}.`);
    void shutdown(FAILURE_EXIT_CODE);
  });

  children.push(child);
}

function terminateProcess(child) {
  if (!child.pid) {
    return Promise.resolve();
  }

  if (process.platform !== "win32") {
    child.kill("SIGINT");
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const killer = spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });

    killer.on("close", () => resolve());
    killer.on("error", () => resolve());
  });
}

async function shutdown(exitCode) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  await Promise.allSettled(children.map((child) => terminateProcess(child)));
  process.exit(exitCode);
}

process.on("SIGINT", () => {
  void shutdown(SUCCESS_EXIT_CODE);
});

process.on("SIGTERM", () => {
  void shutdown(SUCCESS_EXIT_CODE);
});

startProcess("backend", serverDir, BACKEND_ARGS);
startProcess("frontend", rootDir, FRONTEND_ARGS);
