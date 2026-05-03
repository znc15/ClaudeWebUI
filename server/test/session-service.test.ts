import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import type { PtyExitEvent, PtyFactory, PtyProcess, SpawnOptions } from "../src/pty.js";
import { SessionService } from "../src/session-service.js";
import { SessionStore } from "../src/session-store.js";
import type { ServerConfig, ServerEvent, SessionSummary } from "../src/types.js";

class FakePtyProcess implements PtyProcess {
  private readonly dataListeners = new Set<(data: string) => void>();
  private readonly exitListeners = new Set<(event: PtyExitEvent) => void>();
  readonly writes: string[] = [];
  readonly sizes: Array<{ cols: number; rows: number }> = [];
  killed = false;

  write(data: string): void {
    this.writes.push(data);
  }

  resize(cols: number, rows: number): void {
    this.sizes.push({ cols, rows });
  }

  kill(): void {
    this.killed = true;
  }

  onData(listener: (data: string) => void): { dispose(): void } {
    this.dataListeners.add(listener);
    return {
      dispose: () => {
        this.dataListeners.delete(listener);
      },
    };
  }

  onExit(listener: (event: PtyExitEvent) => void): { dispose(): void } {
    this.exitListeners.add(listener);
    return {
      dispose: () => {
        this.exitListeners.delete(listener);
      },
    };
  }

  emitData(data: string): void {
    for (const listener of this.dataListeners) {
      listener(data);
    }
  }

  emitExit(exitCode: number): void {
    for (const listener of this.exitListeners) {
      listener({ exitCode });
    }
  }
}

const TEST_CONFIG: ServerConfig = {
  host: "127.0.0.1",
  port: 4096,
  password: null,
  dataDir: "",
  command: "claude",
  args: [],
  defaultCwd: "O:/ClaudeWebUI",
};

test("SessionService streams PTY output and blocks writes after exit", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "claude-webui-service-"));
  const pty = new FakePtyProcess();
  const store = new SessionStore(tempDir);
  const service = new SessionService(
    { ...TEST_CONFIG, dataDir: tempDir },
    store,
    createSinglePtyFactory(pty),
  );

  try {
    const session = await service.createSession({ cwd: TEST_CONFIG.defaultCwd });
    const events: ServerEvent[] = [];
    const detach = await service.attach(session.id, (event) => {
      events.push(event);
    });

    assert.ok(detach);
    assert.equal(await service.handleResize(session.id, 100, 30), true);
    assert.equal(await service.handleInput(session.id, "你好 Claude"), true);
    assert.deepEqual(pty.sizes, [{ cols: 100, rows: 30 }]);
    assert.deepEqual(pty.writes, ["你好 Claude\r"]);

    pty.emitData("Thinking: 先检查上下文\n");
    pty.emitData("Bash: dir\n");
    pty.emitData("已完成。");
    await service.waitForIdle(session.id);

    const detail = await service.getSession(session.id);
    assert.ok(detail);
    assert.equal(detail.messages.length, 2);
    assert.equal(detail.messages[0]?.role, "user");
    assert.equal(detail.messages[1]?.role, "assistant");
    assert.deepEqual(detail.messages[1]?.blocks, [
      {
        kind: "thinking",
        toolName: "Thinking",
        steps: 1,
        content: ["先检查上下文"],
      },
      {
        kind: "bash",
        toolName: "Bash",
        cmd: "dir",
        output: "",
      },
      {
        kind: "text",
        content: "已完成。",
      },
    ]);

    pty.emitExit(0);
    await service.waitForIdle(session.id);

    assert.equal(await service.handleInput(session.id, "还能发吗"), false);
    assert.equal(await service.handleResize(session.id, 120, 40), false);
    assert.deepEqual(pty.writes, ["你好 Claude\r"]);

    const statusEvent = events.find((event) => event.type === "session.status");
    assert.deepEqual(statusEvent, {
      type: "session.status",
      status: "exited",
      exitCode: 0,
    });

    detach?.();
  } finally {
    await service.waitForIdle();
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("SessionService attaches exited sessions without spawning a new PTY", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "claude-webui-service-"));
  const store = new SessionStore(tempDir);
  const spawnOptions: SpawnOptions[] = [];
  const ptyFactory: PtyFactory = (options) => {
    spawnOptions.push(options);
    return new FakePtyProcess();
  };
  const service = new SessionService(
    { ...TEST_CONFIG, dataDir: tempDir },
    store,
    ptyFactory,
  );
  const session: SessionSummary = {
    id: "archived-session",
    title: "已结束对话",
    cwd: TEST_CONFIG.defaultCwd,
    createdAt: "2026-05-03T10:00:00.000Z",
    updatedAt: "2026-05-03T10:01:00.000Z",
    status: "exited",
    lastMessagePreview: "最后一条消息",
  };

  try {
    await store.createSession(session);
    await store.updateStatus(session.id, "exited", 0, session.updatedAt);

    const events: ServerEvent[] = [];
    const detach = await service.attach(session.id, (event) => {
      events.push(event);
    });

    assert.ok(detach);
    assert.equal(spawnOptions.length, 0);
    assert.equal(events[0]?.type, "session.snapshot");
    assert.equal(events[0]?.session.status, "exited");
    assert.equal(await service.handleInput(session.id, "不要重启"), false);
    assert.equal(await service.handleResize(session.id, 120, 40), false);
    assert.equal(spawnOptions.length, 0);

    detach?.();
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
});

test("SessionService reattaches running sessions without spawning another PTY", async () => {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "claude-webui-service-"));
  const pty = new FakePtyProcess();
  let spawnCount = 0;
  const store = new SessionStore(tempDir);
  const service = new SessionService(
    { ...TEST_CONFIG, dataDir: tempDir },
    store,
    () => {
      spawnCount += 1;
      return pty;
    },
  );

  try {
    const session = await service.createSession({ cwd: TEST_CONFIG.defaultCwd });
    const firstEvents: ServerEvent[] = [];
    const firstDetach = await service.attach(session.id, (event) => {
      firstEvents.push(event);
    });

    assert.ok(firstDetach);
    await service.handleInput(session.id, "第一次消息");
    pty.emitData("Bash: pwd\n");
    await service.waitForIdle(session.id);
    firstDetach?.();

    const secondEvents: ServerEvent[] = [];
    const secondDetach = await service.attach(session.id, (event) => {
      secondEvents.push(event);
    });

    assert.ok(secondDetach);
    assert.equal(spawnCount, 1);
    assert.equal(secondEvents[0]?.type, "session.snapshot");
    assert.equal(secondEvents[0]?.session.messages.length, 2);
    assert.equal(secondEvents[0]?.session.messages[1]?.blocks[0]?.kind, "bash");
    assert.equal(await service.handleInput(session.id, "第二次消息"), true);
    assert.deepEqual(pty.writes, ["第一次消息\r", "第二次消息\r"]);

    secondDetach?.();
  } finally {
    await service.waitForIdle();
    await rm(tempDir, { recursive: true, force: true });
  }
});

function createSinglePtyFactory(pty: PtyProcess): PtyFactory {
  return () => pty;
}
