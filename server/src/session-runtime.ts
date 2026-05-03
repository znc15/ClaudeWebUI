import crypto from "node:crypto";

import type { PtyFactory, PtyProcess, SpawnOptions } from "./pty.js";
import type { SessionStore } from "./session-store.js";
import { deriveBlocks, stripAnsi } from "./tool-parser.js";
import type { ChatMessage, ServerEvent, SessionDetail, SessionStatus } from "./types.js";

type Subscriber = (event: ServerEvent) => void;

const DEFAULT_TITLE = "新对话";

interface SessionRuntimeOptions {
  session: SessionDetail;
  store: SessionStore;
  ptyFactory: PtyFactory;
  spawnOptions: SpawnOptions;
}

export class SessionRuntime {
  private readonly subscribers = new Set<Subscriber>();
  private readonly ptyProcess: PtyProcess;
  private currentAssistantId: string | null = null;
  private pendingWork = Promise.resolve();

  constructor(private readonly options: SessionRuntimeOptions) {
    this.ptyProcess = options.ptyFactory(options.spawnOptions);
    this.ptyProcess.onData((data) => {
      this.enqueue(() => this.handleData(data));
    });
    this.ptyProcess.onExit((event) => {
      this.enqueue(() => this.handleExit(event.exitCode));
    });
  }

  attach(subscriber: Subscriber): () => void {
    this.subscribers.add(subscriber);
    subscriber({
      type: "session.snapshot",
      session: this.snapshot(),
    });

    return () => {
      this.subscribers.delete(subscriber);
    };
  }

  async sendInput(content: string): Promise<void> {
    const trimmed = content.trim();
    if (!trimmed) {
      return;
    }

    this.currentAssistantId = null;
    const message = createMessage("user", trimmed);
    this.options.session.messages.push(message);
    await this.options.store.appendMessage(this.options.session.id, message);
    this.updateSessionTimestamp(message.createdAt);
    await this.maybeUpdateTitle(trimmed, message.createdAt);
    this.broadcast({
      type: "session.message",
      message,
    });
    this.ptyProcess.write(`${content}\r`);
  }

  resize(cols: number, rows: number): void {
    this.ptyProcess.resize(cols, rows);
  }

  dispose(): void {
    this.ptyProcess.kill();
  }

  whenIdle(): Promise<void> {
    return this.pendingWork;
  }

  snapshot(): SessionDetail {
    return {
      ...this.options.session,
      messages: [...this.options.session.messages],
    };
  }

  private async handleData(data: string): Promise<void> {
    const content = stripAnsi(data);
    if (!content.trim()) {
      return;
    }

    const message = await this.ensureAssistantMessage();
    message.content = `${message.content}${content}`;
    message.blocks = deriveBlocks(message.content);
    const updatedAt = new Date().toISOString();
    this.updateSessionTimestamp(updatedAt);
    await this.options.store.updateMessage(
      this.options.session.id,
      message,
      updatedAt,
    );
    this.broadcast({
      type: "session.message",
      message,
    });
  }

  private async handleExit(exitCode: number): Promise<void> {
    const updatedAt = new Date().toISOString();
    this.options.session.status = "exited";
    this.options.session.exitCode = exitCode;
    this.options.session.updatedAt = updatedAt;
    await this.options.store.updateStatus(
      this.options.session.id,
      "exited",
      exitCode,
      updatedAt,
    );
    this.broadcast({
      type: "session.status",
      status: "exited",
      exitCode,
    });
  }

  private async ensureAssistantMessage(): Promise<ChatMessage> {
    const existing = this.currentAssistantId
      ? this.options.session.messages.find(
          (message) => message.id === this.currentAssistantId,
        )
      : null;
    if (existing) {
      return existing;
    }

    const message = createMessage("assistant", "");
    this.currentAssistantId = message.id;
    this.options.session.messages.push(message);
    await this.options.store.appendMessage(this.options.session.id, message);
    return message;
  }

  private async maybeUpdateTitle(
    content: string,
    updatedAt: string,
  ): Promise<void> {
    if (this.options.session.title !== DEFAULT_TITLE) {
      return;
    }

    const title = content.slice(0, 40);
    this.options.session.title = title;
    this.options.session.updatedAt = updatedAt;
    await this.options.store.updateTitle(this.options.session.id, title, updatedAt);
  }

  private updateSessionTimestamp(updatedAt: string): void {
    this.options.session.updatedAt = updatedAt;
    this.options.session.status = "running";
  }

  private broadcast(event: ServerEvent): void {
    for (const subscriber of this.subscribers) {
      subscriber(event);
    }
  }

  private enqueue(work: () => Promise<void>): void {
    this.pendingWork = this.pendingWork.then(work, work);
  }
}

export function createSessionDetail(
  sessionId: string,
  cwd: string,
  title = DEFAULT_TITLE,
): SessionDetail {
  const timestamp = new Date().toISOString();
  return {
    id: sessionId,
    title,
    cwd,
    createdAt: timestamp,
    updatedAt: timestamp,
    status: "running",
    lastMessagePreview: "",
    messages: [],
    exitCode: null,
  };
}

function createMessage(role: ChatMessage["role"], content: string): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    blocks: deriveBlocks(content),
    createdAt: new Date().toISOString(),
  };
}

export function createStoredSummary(session: SessionDetail): {
  id: string;
  title: string;
  cwd: string;
  createdAt: string;
  updatedAt: string;
  status: SessionStatus;
  lastMessagePreview: string;
} {
  return {
    id: session.id,
    title: session.title,
    cwd: session.cwd,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    status: session.status,
    lastMessagePreview: "",
  };
}
