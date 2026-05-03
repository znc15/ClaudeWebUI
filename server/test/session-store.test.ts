import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { SessionStore } from "../src/session-store.js";
import type { ChatMessage, SessionSummary } from "../src/types.js";

test("SessionStore replays session history from jsonl events", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "claude-webui-store-"));
  const store = new SessionStore(tempDir);
  const session: SessionSummary = {
    id: "session-1",
    title: "新对话",
    cwd: "O:/ClaudeWebUI",
    createdAt: "2026-05-03T10:00:00.000Z",
    updatedAt: "2026-05-03T10:00:00.000Z",
    status: "running",
    lastMessagePreview: "",
  };
  const userMessage: ChatMessage = {
    id: "message-1",
    role: "user",
    content: "帮我查看日志",
    blocks: [{ kind: "text", content: "帮我查看日志" }],
    createdAt: "2026-05-03T10:00:01.000Z",
  };

  await store.createSession(session);
  await store.appendMessage(session.id, userMessage);
  await store.updateTitle(session.id, "帮我查看日志", "2026-05-03T10:00:01.000Z");
  await store.updateStatus(session.id, "exited", 0, "2026-05-03T10:00:02.000Z");

  const detail = await store.getSession(session.id);
  const sessions = await store.listSessions();

  assert.ok(detail);
  assert.equal(detail.title, "帮我查看日志");
  assert.equal(detail.status, "exited");
  assert.equal(detail.exitCode, 0);
  assert.equal(detail.messages[0]?.content, "帮我查看日志");
  assert.equal(sessions[0]?.lastMessagePreview, "帮我查看日志");

  await rm(tempDir, { recursive: true, force: true });
});
