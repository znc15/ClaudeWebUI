import type {
  ClientEvent,
  ConnectionSettings,
  HealthResponse,
  ServerEvent,
  SessionCreateInput,
  SessionDetail,
  SessionSummary,
} from "../types";

const PASSWORD_HEADER = "X-Claude-Webui-Password";
const DEFAULT_PORT = 4096;

interface SocketHandlers {
  onClose: (event: CloseEvent) => void;
  onError: (event: Event) => void;
  onEvent: (event: ServerEvent) => void;
  onOpen: () => void;
}

export function getDefaultBaseUrl(): string {
  if (typeof window === "undefined") {
    return `http://127.0.0.1:${DEFAULT_PORT}`;
  }

  const host = window.location.hostname || "127.0.0.1";
  return `http://${host}:${DEFAULT_PORT}`;
}

export async function fetchHealth(
  settings: ConnectionSettings,
): Promise<HealthResponse> {
  return requestJson<HealthResponse>(settings, "/api/health");
}

export async function fetchSessions(
  settings: ConnectionSettings,
): Promise<SessionSummary[]> {
  return requestJson<SessionSummary[]>(settings, "/api/sessions");
}

export async function fetchSession(
  settings: ConnectionSettings,
  sessionId: string,
): Promise<SessionDetail> {
  return requestJson<SessionDetail>(settings, `/api/sessions/${sessionId}`);
}

export async function createSession(
  settings: ConnectionSettings,
  payload: SessionCreateInput,
): Promise<SessionDetail> {
  return requestJson<SessionDetail>(settings, "/api/sessions", {
    body: JSON.stringify(payload),
    method: "POST",
  });
}

export function connectSessionSocket(
  settings: ConnectionSettings,
  sessionId: string,
  handlers: SocketHandlers,
): WebSocket {
  const url = new URL("/ws", toHttpUrl(settings.baseUrl));
  url.searchParams.set("sessionId", sessionId);
  if (settings.password.trim()) {
    url.searchParams.set("password", settings.password.trim());
  }

  const socket = new WebSocket(toWsUrl(url));
  socket.addEventListener("open", handlers.onOpen);
  socket.addEventListener("close", handlers.onClose);
  socket.addEventListener("error", handlers.onError);
  socket.addEventListener("message", (event) => {
    handlers.onEvent(JSON.parse(event.data as string) as ServerEvent);
  });
  return socket;
}

export function sendSocketEvent(
  socket: WebSocket,
  event: ClientEvent,
): void {
  socket.send(JSON.stringify(event));
}

async function requestJson<T>(
  settings: ConnectionSettings,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(new URL(path, toHttpUrl(settings.baseUrl)), {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(settings.password),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Request failed with ${response.status}`);
  }

  return (await response.json()) as T;
}

function authHeaders(password: string): HeadersInit {
  return password.trim() ? { [PASSWORD_HEADER]: password.trim() } : {};
}

function toHttpUrl(rawBaseUrl: string): string {
  return rawBaseUrl.trim().replace(/\/+$/, "");
}

function toWsUrl(url: URL): string {
  return url.toString().replace(/^http/, "ws");
}
