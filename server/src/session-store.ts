import { appendFile, mkdir, readdir, readFile, stat } from "node:fs/promises";
import path from "node:path";

import type {
  ChatMessage,
  SessionDetail,
  SessionStatus,
  SessionSummary,
} from "./types.js";

type SessionEvent =
  | { type: "session.created"; session: SessionSummary }
  | { type: "session.title"; title: string; updatedAt: string }
  | { type: "session.status"; status: SessionStatus; exitCode: number | null; updatedAt: string }
  | { type: "message.added"; message: ChatMessage; updatedAt: string }
  | { type: "message.updated"; message: ChatMessage; updatedAt: string };

const SESSION_FILE_SUFFIX = ".jsonl";

export class SessionStore {
  constructor(private readonly dataDir: string) {}

  async createSession(session: SessionSummary): Promise<void> {
    await this.writeEvent(session.id, {
      type: "session.created",
      session,
    });
  }

  async appendMessage(sessionId: string, message: ChatMessage): Promise<void> {
    await this.writeEvent(sessionId, {
      type: "message.added",
      message,
      updatedAt: message.createdAt,
    });
  }

  async updateMessage(
    sessionId: string,
    message: ChatMessage,
    updatedAt: string,
  ): Promise<void> {
    await this.writeEvent(sessionId, {
      type: "message.updated",
      message,
      updatedAt,
    });
  }

  async updateTitle(
    sessionId: string,
    title: string,
    updatedAt: string,
  ): Promise<void> {
    await this.writeEvent(sessionId, {
      type: "session.title",
      title,
      updatedAt,
    });
  }

  async updateStatus(
    sessionId: string,
    status: SessionStatus,
    exitCode: number | null,
    updatedAt: string,
  ): Promise<void> {
    await this.writeEvent(sessionId, {
      type: "session.status",
      status,
      exitCode,
      updatedAt,
    });
  }

  async getSession(sessionId: string): Promise<SessionDetail | null> {
    const filePath = this.sessionFilePath(sessionId);
    try {
      await stat(filePath);
    } catch {
      return null;
    }

    const events = await this.readEvents(filePath);
    return replaySession(events);
  }

  async listSessions(): Promise<SessionSummary[]> {
    await mkdir(this.dataDir, { recursive: true });
    const entries = await readdir(this.dataDir, { withFileTypes: true });
    const sessions = await Promise.all(
      entries
        .filter((entry) => entry.isFile() && entry.name.endsWith(SESSION_FILE_SUFFIX))
        .map(async (entry) => {
          const detail = await this.getSession(entry.name.replace(SESSION_FILE_SUFFIX, ""));
          return detail ? toSummary(detail) : null;
        }),
    );

    return sessions
      .filter((session): session is SessionSummary => session !== null)
      .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }

  private async writeEvent(sessionId: string, event: SessionEvent): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    const filePath = this.sessionFilePath(sessionId);
    const line = `${JSON.stringify(event)}\n`;
    await appendFile(filePath, line, "utf8");
  }

  private async readEvents(filePath: string): Promise<SessionEvent[]> {
    const raw = await readFile(filePath, "utf8");
    return raw
      .split("\n")
      .filter(Boolean)
      .map((line) => JSON.parse(line) as SessionEvent);
  }

  private sessionFilePath(sessionId: string): string {
    return path.join(this.dataDir, `${sessionId}${SESSION_FILE_SUFFIX}`);
  }
}

function replaySession(events: SessionEvent[]): SessionDetail | null {
  let session: SessionDetail | null = null;

  for (const event of events) {
    if (event.type === "session.created") {
      session = {
        ...event.session,
        messages: [],
        exitCode: null,
      };
      continue;
    }

    if (!session) {
      continue;
    }

    if (event.type === "session.title") {
      session.title = event.title;
      session.updatedAt = event.updatedAt;
      continue;
    }

    if (event.type === "session.status") {
      session.status = event.status;
      session.exitCode = event.exitCode;
      session.updatedAt = event.updatedAt;
      continue;
    }

    const existingIndex = session.messages.findIndex(
      (message) => message.id === event.message.id,
    );

    if (existingIndex === -1) {
      session.messages.push(event.message);
    } else {
      session.messages[existingIndex] = event.message;
    }

    session.updatedAt = event.updatedAt;
  }

  return session;
}

function toSummary(session: SessionDetail): SessionSummary {
  const lastMessage = [...session.messages]
    .reverse()
    .find((message) => message.content.trim().length > 0);

  return {
    id: session.id,
    title: session.title,
    cwd: session.cwd,
    createdAt: session.createdAt,
    updatedAt: session.updatedAt,
    status: session.status,
    lastMessagePreview: lastMessage?.content.slice(0, 120) ?? "",
  };
}
