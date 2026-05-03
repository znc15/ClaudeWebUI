import { spawn } from "node-pty";

import type { PtyFactory } from "./pty.js";

export const createNodePtyProcess: PtyFactory = (options) =>
  spawn(options.command, options.args, {
    name: "xterm-256color",
    cols: options.cols,
    rows: options.rows,
    cwd: options.cwd,
    env: options.env,
  });
