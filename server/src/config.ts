import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { ServerConfig } from "./types.js";

interface ConfigFileShape {
  host?: string;
  port?: number;
  password?: string | null;
  dataDir?: string;
  command?: string;
  args?: string[];
  defaultCwd?: string;
}

const DEFAULT_HOST = "127.0.0.1";
const DEFAULT_PORT = 4096;
const DEFAULT_COMMAND = "claude";
const DEFAULT_DATA_DIR = "../data";

export function loadConfig(): ServerConfig {
  const baseDir = path.dirname(fileURLToPath(import.meta.url));
  const fileConfig = readConfigFile(path.resolve(baseDir, "../config.json"));
  const envArgs = process.env.CLAUDE_WEBUI_ARGS?.trim();

  return {
    host: process.env.CLAUDE_WEBUI_HOST ?? fileConfig.host ?? DEFAULT_HOST,
    port: toNumber(process.env.CLAUDE_WEBUI_PORT, fileConfig.port, DEFAULT_PORT),
    password:
      process.env.CLAUDE_WEBUI_PASSWORD ??
      fileConfig.password ??
      null,
    dataDir: path.resolve(
      baseDir,
      process.env.CLAUDE_WEBUI_DATA_DIR ??
        fileConfig.dataDir ??
        DEFAULT_DATA_DIR,
    ),
    command:
      process.env.CLAUDE_WEBUI_COMMAND ??
      fileConfig.command ??
      DEFAULT_COMMAND,
    args: envArgs ? envArgs.split(/\s+/) : fileConfig.args ?? [],
    defaultCwd:
      process.env.CLAUDE_WEBUI_CWD ??
      fileConfig.defaultCwd ??
      process.cwd(),
  };
}

function readConfigFile(configPath: string): ConfigFileShape {
  if (!existsSync(configPath)) {
    return {};
  }

  const raw = readFileSync(configPath, "utf8");
  return JSON.parse(raw) as ConfigFileShape;
}

function toNumber(
  rawValue: string | undefined,
  fileValue: number | undefined,
  fallback: number,
): number {
  const source = rawValue ?? fileValue;
  if (source === undefined) {
    return fallback;
  }

  const value = Number(source);
  return Number.isFinite(value) ? value : fallback;
}
