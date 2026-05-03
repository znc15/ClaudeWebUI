import test from "node:test";
import assert from "node:assert/strict";

import { deriveBlocks, stripAnsi } from "../src/tool-parser.js";

test("stripAnsi removes terminal escape sequences", () => {
  assert.equal(stripAnsi("\u001b[31mhello\u001b[0m"), "hello");
});

test("deriveBlocks parses Claude Code labels and preserves adjacent details", () => {
  const blocks = deriveBlocks([
    "思考: 先检查当前目录",
    "继续确认会话状态",
    "子Agent: lint-fixer",
    "任务: 修复 server lint",
    "状态: completed",
    "Bash: npm run lint",
    "> eslint src test",
    "All files pass lint.",
    "Search: sessionId",
    "src/app/App.tsx:12",
    "server/src/index.ts:74",
    "Read: src/app/App.tsx",
    "const current = activeSessionId;",
    "MultiEdit: src/app/App.tsx",
    "Before:",
    "const [socketReady, setSocketReady] = useState(false);",
    "After:",
    "const [socketState, setSocketState] = useState(initialSocketState);",
    "处理完成。",
  ].join("\n"));

  assert.deepEqual(blocks, [
    {
      kind: "thinking",
      toolName: "思考",
      steps: 2,
      content: ["先检查当前目录", "继续确认会话状态"],
    },
    {
      kind: "agent",
      toolName: "子Agent",
      agent: "lint-fixer",
      status: "completed",
      details: ["任务: 修复 server lint", "状态: completed"],
    },
    {
      kind: "bash",
      toolName: "Bash",
      cmd: "npm run lint",
      output: "> eslint src test\nAll files pass lint.",
    },
    {
      kind: "grep",
      toolName: "Search",
      pattern: "sessionId",
      files: ["src/app/App.tsx:12", "server/src/index.ts:74"],
    },
    {
      kind: "edit",
      toolName: "Read",
      action: "read",
      file: "src/app/App.tsx",
      before: "",
      after: "",
      excerpt: "const current = activeSessionId;",
    },
    {
      kind: "edit",
      toolName: "MultiEdit",
      action: "multiedit",
      file: "src/app/App.tsx",
      before: "const [socketReady, setSocketReady] = useState(false);",
      after: "const [socketState, setSocketState] = useState(initialSocketState);",
      excerpt: "",
    },
    {
      kind: "text",
      content: "处理完成。",
    },
  ]);
});

test("deriveBlocks infers edit before and after from diff-style lines", () => {
  const blocks = deriveBlocks([
    "Edit: server/src/tool-parser.ts",
    "-const TOOL_PATTERN = /old/;",
    "+const TOOL_PATTERN = /new/;",
  ].join("\n"));

  assert.deepEqual(blocks, [
    {
      kind: "edit",
      toolName: "Edit",
      action: "edit",
      file: "server/src/tool-parser.ts",
      before: "const TOOL_PATTERN = /old/;",
      after: "const TOOL_PATTERN = /new/;",
      excerpt: "",
    },
  ]);
});

test("deriveBlocks supports Task and Shell aliases", () => {
  const blocks = deriveBlocks([
    "Task: parser-audit",
    "Status: completed",
    "Shell: npm test",
    "> tsx --test",
  ].join("\n"));

  assert.deepEqual(blocks, [
    {
      kind: "agent",
      toolName: "Task",
      agent: "parser-audit",
      status: "completed",
      details: ["Status: completed"],
    },
    {
      kind: "bash",
      toolName: "Shell",
      cmd: "npm test",
      output: "> tsx --test",
    },
  ]);
});
