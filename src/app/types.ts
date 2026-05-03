export type ToolBlock =
  | { kind: "thinking"; toolName: string; steps: number; content: string[] }
  | { kind: "agent"; toolName: string; agent: string; status: string; details: string[] }
  | { kind: "bash"; toolName: string; cmd: string; output: string }
  | { kind: "grep"; toolName: string; pattern: string; files: string[] }
  | {
      kind: "edit";
      toolName: string;
      action: "edit" | "write" | "multiedit" | "read";
      file: string;
      before: string;
      after: string;
      excerpt: string;
    }
  | { kind: "text"; content: string };

export type ChatMessageRole = "user" | "assistant" | "system";
export type SessionStatus = "idle" | "running" | "exited";

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  blocks: ToolBlock[];
  createdAt: string;
}

export interface SessionSummary {
  id: string;
  title: string;
  cwd: string;
  createdAt: string;
  updatedAt: string;
  status: SessionStatus;
  lastMessagePreview: string;
}

export interface SessionDetail extends SessionSummary {
  messages: ChatMessage[];
  exitCode: number | null;
}

export interface SessionCreateInput {
  cwd?: string;
  title?: string;
  cols?: number;
  rows?: number;
}

export interface HealthResponse {
  ok: boolean;
  authRequired: boolean;
  command: string;
  defaultCwd: string;
}

export interface ConnectionSettings {
  baseUrl: string;
  password: string;
  defaultCwd: string;
}

export interface ServerEntry {
  id: string;
  name: string;
  url: string;
  active: boolean;
}

export type SocketPhase =
  | "idle"
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting"
  | "error";

export interface SocketStatus {
  phase: SocketPhase;
  detail: string;
  attempts: number;
}

export interface ClientInputEvent {
  type: "input";
  content: string;
}

export interface ClientResizeEvent {
  type: "resize";
  cols: number;
  rows: number;
}

export type ClientEvent = ClientInputEvent | ClientResizeEvent;

export interface SessionSnapshotEvent {
  type: "session.snapshot";
  session: SessionDetail;
}

export interface SessionMessageEvent {
  type: "session.message";
  message: ChatMessage;
}

export interface SessionStatusEvent {
  type: "session.status";
  status: SessionStatus;
  exitCode: number | null;
}

export type ServerEvent =
  | SessionSnapshotEvent
  | SessionMessageEvent
  | SessionStatusEvent;
