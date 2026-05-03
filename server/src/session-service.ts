import crypto from "node:crypto";

import type { PtyFactory, SpawnOptions } from "./pty.js";
import { SessionRuntime, createSessionDetail, createStoredSummary } from "./session-runtime.js";
import type { SessionStore } from "./session-store.js";
import type {
  ServerConfig,
  ServerEvent,
  SessionCreateInput,
  SessionDetail,
  SessionSummary,
} from "./types.js";

const DEFAULT_COLS = 120;
const DEFAULT_ROWS = 40;

export class SessionService {
  private readonly runtimes = new Map<string, SessionRuntime>();

  constructor(
    private readonly config: ServerConfig,
    private readonly store: SessionStore,
    private readonly ptyFactory: PtyFactory,
  ) {}

  async createSession(input: SessionCreateInput): Promise<SessionDetail> {
    const session = createSessionDetail(
      crypto.randomUUID(),
      input.cwd ?? this.config.defaultCwd,
      input.title,
    );

    await this.store.createSession(createStoredSummary(session));
    this.createRuntime(session, input.cols, input.rows);

    return session;
  }

  async listSessions(): Promise<SessionSummary[]> {
    return this.store.listSessions();
  }

  async getSession(sessionId: string): Promise<SessionDetail | null> {
    const runtime = this.runtimes.get(sessionId);
    if (runtime) {
      return runtime.snapshot();
    }

    return this.store.getSession(sessionId);
  }

  async attach(
    sessionId: string,
    subscriber: (event: ServerEvent) => void,
  ): Promise<(() => void) | null> {
    const existingRuntime = this.runtimes.get(sessionId);
    if (existingRuntime) {
      return existingRuntime.attach(subscriber);
    }

    const storedSession = await this.store.getSession(sessionId);
    if (!storedSession) {
      return null;
    }

    if (storedSession.status === "exited") {
      subscriber({
        type: "session.snapshot",
        session: storedSession,
      });
      return () => {};
    }

    const runtime = this.createRuntime(storedSession);
    return runtime.attach(subscriber);
  }

  async handleInput(sessionId: string, content: string): Promise<boolean> {
    const runtime = await this.ensureRuntime(sessionId);
    if (!runtime || runtime.snapshot().status === "exited") {
      return false;
    }

    await runtime.sendInput(content);
    return true;
  }

  async handleResize(
    sessionId: string,
    cols: number,
    rows: number,
  ): Promise<boolean> {
    const runtime = await this.ensureRuntime(sessionId);
    if (!runtime || runtime.snapshot().status === "exited") {
      return false;
    }

    runtime.resize(cols, rows);
    return true;
  }

  async waitForIdle(sessionId?: string): Promise<void> {
    if (sessionId) {
      await this.runtimes.get(sessionId)?.whenIdle();
      return;
    }

    await Promise.all(
      [...this.runtimes.values()].map((runtime) => runtime.whenIdle()),
    );
  }

  private async ensureRuntime(sessionId: string): Promise<SessionRuntime | null> {
    const existing = this.runtimes.get(sessionId);
    if (existing) {
      return existing;
    }

    const storedSession = await this.store.getSession(sessionId);
    if (!storedSession) {
      return null;
    }

    if (storedSession.status === "exited") {
      return null;
    }

    return this.createRuntime(storedSession);
  }

  private toSpawnOptions(
    cwd: string,
    cols = DEFAULT_COLS,
    rows = DEFAULT_ROWS,
  ): SpawnOptions {
    return {
      command: this.config.command,
      args: this.config.args,
      cwd,
      cols,
      rows,
      env: process.env,
    };
  }

  private createRuntime(
    session: SessionDetail,
    cols = DEFAULT_COLS,
    rows = DEFAULT_ROWS,
  ): SessionRuntime {
    const runtime = new SessionRuntime({
      session: {
        ...session,
        status: "running",
        exitCode: null,
      },
      store: this.store,
      ptyFactory: this.ptyFactory,
      spawnOptions: this.toSpawnOptions(session.cwd, cols, rows),
    });
    this.runtimes.set(session.id, runtime);
    return runtime;
  }
}
