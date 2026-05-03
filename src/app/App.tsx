import { useEffect, useMemo, useRef, useState } from "react";
import { Moon, RefreshCw, Sun } from "lucide-react";
import { Toaster, toast } from "sonner";

import { ChatView } from "./components/chat-view";
import { LeftSidebar } from "./components/left-sidebar";
import {
  connectSessionSocket,
  createSession,
  fetchHealth,
  fetchSession,
  fetchSessions,
  getDefaultBaseUrl,
  sendSocketEvent,
} from "./lib/api";
import { evolveSession, mergeSessionSummary, pickActiveSessionId } from "./lib/session-state";
import {
  createSocketStatus,
  describeSocketClose,
  shouldRetrySocket,
  SOCKET_MAX_ATTEMPTS,
  SOCKET_RETRY_DELAY_MS,
} from "./lib/socket-status";
import type {
  ConnectionSettings,
  HealthResponse,
  ServerEvent,
  SessionDetail,
  SessionSummary,
  SocketStatus,
} from "./types";

const ACTIVE_SESSION_KEY = "claude-webui:active-session-id";
const SETTINGS_KEY = "claude-webui:settings";
const THEME_KEY = "claude-webui:theme";
const IDLE_SOCKET_STATUS = createSocketStatus("idle", "未连接到会话");

export default function App() {
  const [isDark, setIsDark] = useState(readStoredTheme);
  const [settings, setSettings] = useState(readStoredSettings);
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<SessionDetail | null>(null);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] = useState<SocketStatus>(IDLE_SOCKET_STATUS);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const activeSessionIdRef = useRef<string | null>(null);
  const activeSessionRef = useRef<SessionDetail | null>(null);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
  }, [isDark]);

  useEffect(() => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    activeSessionIdRef.current = activeSessionId;
    if (!activeSessionId) {
      window.localStorage.removeItem(ACTIVE_SESSION_KEY);
      return;
    }

    window.localStorage.setItem(ACTIVE_SESSION_KEY, activeSessionId);
  }, [activeSessionId]);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    void refreshWorkspace();
    return () => disconnectSocket(IDLE_SOCKET_STATUS);
  }, [settings.baseUrl, settings.password]);

  useEffect(() => {
    if (!activeSessionId) {
      setActiveSession(null);
      disconnectSocket(IDLE_SOCKET_STATUS);
      return;
    }

    void openSession(activeSessionId);
  }, [activeSessionId, settings.baseUrl, settings.password]);

  const socketReady = socketStatus.phase === "connected";
  const connectionLabel = useMemo(
    () => buildConnectionLabel(health, error),
    [error, health],
  );

  async function refreshWorkspace(): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      const [nextHealth, nextSessions] = await Promise.all([
        fetchHealth(settings),
        fetchSessions(settings),
      ]);
      const preferredSessionId =
        activeSessionIdRef.current ?? readStoredActiveSessionId();
      const nextActiveSessionId = pickActiveSessionId(
        preferredSessionId,
        nextSessions,
      );

      setHealth(nextHealth);
      setSessions(nextSessions);
      setSettings((current) =>
        current.defaultCwd
          ? current
          : { ...current, defaultCwd: nextHealth.defaultCwd },
      );
      setSelectedSession(nextActiveSessionId);

      if (!nextActiveSessionId) {
        setActiveSession(null);
        disconnectSocket(IDLE_SOCKET_STATUS);
        return;
      }

      if (nextActiveSessionId === preferredSessionId) {
        await openSession(nextActiveSessionId);
      }
    } catch (caughtError) {
      const message = toErrorMessage(caughtError);
      setError(message);
      setSessions([]);
      setSelectedSession(null);
      setActiveSession(null);
      disconnectSocket(createSocketStatus("disconnected", message));
    } finally {
      setBusy(false);
    }
  }

  async function openSession(sessionId: string): Promise<void> {
    setBusy(true);
    setError(null);

    try {
      const session = await fetchSession(settings, sessionId);
      if (activeSessionIdRef.current !== sessionId) {
        return;
      }

      setActiveSession(session);
      activeSessionRef.current = session;
      setSessions((current) => mergeSessionSummary(current, session));

      if (session.status === "exited") {
        disconnectSocket(createSocketStatus("disconnected", "会话已退出"));
        return;
      }

      connectSocket(sessionId, 0);
    } catch (caughtError) {
      if (activeSessionIdRef.current !== sessionId) {
        return;
      }

      const message = toErrorMessage(caughtError);
      setError(message);
      disconnectSocket(createSocketStatus("error", message));
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateSession(): Promise<void> {
    setCreating(true);
    setError(null);

    try {
      const session = await createSession(settings, {
        cwd: settings.defaultCwd.trim() || health?.defaultCwd,
      });
      setSessions((current) => mergeSessionSummary(current, session));
      setSelectedSession(session.id);
      toast.success("已创建新会话");
    } catch (caughtError) {
      const message = toErrorMessage(caughtError);
      setError(message);
      toast.error(message);
    } finally {
      setCreating(false);
    }
  }

  function handleSelectSession(sessionId: string): void {
    if (sessionId === activeSessionIdRef.current) {
      void openSession(sessionId);
      return;
    }

    setDraft("");
    setSelectedSession(sessionId);
  }

  function handleSend(): void {
    if (activeSession?.status === "exited") {
      toast.error("该会话已经退出");
      return;
    }

    const socket = socketRef.current;
    if (!socket || socket.readyState !== WebSocket.OPEN || !socketReady) {
      toast.error(socketStatus.detail || "会话连接还没建立");
      return;
    }

    const content = draft.trim();
    if (!content) {
      return;
    }

    sendSocketEvent(socket, { type: "input", content });
    setDraft("");
  }

  function connectSocket(sessionId: string, attempt: number): void {
    disconnectSocket();
    setSocketStatus(buildSocketProgress(attempt));
    const socket = connectSessionSocket(settings, sessionId, {
      onClose: (event) => handleSocketClose(socket, sessionId, attempt, event),
      onError: () =>
        setSocketStatus(
          createSocketStatus("error", "连接出错，等待 WebSocket 关闭事件"),
        ),
      onEvent: (event) => handleSocketEvent(socket, event),
      onOpen: () => handleSocketOpen(socket),
    });
    socketRef.current = socket;
  }

  function handleSocketOpen(socket: WebSocket): void {
    if (socketRef.current !== socket) {
      return;
    }

    setSocketStatus(createSocketStatus("connected", "WebSocket 已连接"));
    setError(null);
  }

  function handleSocketEvent(socket: WebSocket, event: ServerEvent): void {
    if (socketRef.current !== socket) {
      return;
    }

    let nextSession: SessionDetail | null = null;
    setActiveSession((current) => {
      nextSession = evolveSession(current, event);
      activeSessionRef.current = nextSession;
      return nextSession;
    });

    if (event.type === "session.snapshot") {
      setSessions((current) => mergeSessionSummary(current, event.session));
      return;
    }

    const resolvedSession = nextSession;
    if (resolvedSession) {
      setSessions((current) => mergeSessionSummary(current, resolvedSession));
    }

    if (event.type === "session.status" && event.status === "exited") {
      disconnectSocket(createSocketStatus("disconnected", "会话已退出"));
    }
  }

  function handleSocketClose(
    socket: WebSocket,
    sessionId: string,
    attempt: number,
    event: CloseEvent,
  ): void {
    if (socketRef.current === socket) {
      socketRef.current = null;
    }

    if (activeSessionIdRef.current !== sessionId) {
      return;
    }

    if (activeSessionRef.current?.status === "exited") {
      setSocketStatus(createSocketStatus("disconnected", "会话已退出"));
      return;
    }

    if (!shouldRetrySocket(event.code, event.reason) || attempt >= SOCKET_MAX_ATTEMPTS) {
      const detail =
        attempt >= SOCKET_MAX_ATTEMPTS
          ? `重连次数已达上限 · ${describeSocketClose(event.code, event.reason)}`
          : describeSocketClose(event.code, event.reason);
      setSocketStatus(createSocketStatus("disconnected", detail, attempt));
      return;
    }

    const nextAttempt = attempt + 1;
    setSocketStatus(
      createSocketStatus(
        "reconnecting",
        `连接已断开，${SOCKET_RETRY_DELAY_MS / 1000} 秒后重试（${nextAttempt}/${SOCKET_MAX_ATTEMPTS}）`,
        nextAttempt,
      ),
    );
    reconnectTimerRef.current = window.setTimeout(() => {
      if (activeSessionIdRef.current === sessionId) {
        connectSocket(sessionId, nextAttempt);
      }
    }, SOCKET_RETRY_DELAY_MS);
  }

  function disconnectSocket(nextStatus?: SocketStatus): void {
    clearReconnectTimer();
    const socket = socketRef.current;
    socketRef.current = null;
    if (socket && socket.readyState < WebSocket.CLOSING) {
      socket.close();
    }
    if (nextStatus) {
      setSocketStatus(nextStatus);
    }
  }

  function clearReconnectTimer(): void {
    if (reconnectTimerRef.current === null) {
      return;
    }

    window.clearTimeout(reconnectTimerRef.current);
    reconnectTimerRef.current = null;
  }

  function setSelectedSession(sessionId: string | null): void {
    activeSessionIdRef.current = sessionId;
    setActiveSessionId(sessionId);
  }

  return (
    <div
      className={`min-h-screen ${isDark ? "dark bg-[#161616]" : "bg-[#f3efe6]"}`}
    >
      <Toaster position="bottom-right" />
      <div className="flex min-h-screen flex-col md:flex-row">
        <LeftSidebar
          activeSessionId={activeSessionId}
          busy={busy}
          connectionLabel={connectionLabel}
          creating={creating}
          defaultCwd={settings.defaultCwd}
          error={error}
          health={health}
          isDark={isDark}
          onBaseUrlChange={(baseUrl) =>
            setSettings((current) => ({ ...current, baseUrl }))
          }
          onCreateSession={handleCreateSession}
          onDefaultCwdChange={(defaultCwd) =>
            setSettings((current) => ({ ...current, defaultCwd }))
          }
          onPasswordChange={(password) =>
            setSettings((current) => ({ ...current, password }))
          }
          onRefresh={() => void refreshWorkspace()}
          onSelectSession={handleSelectSession}
          password={settings.password}
          sessions={sessions}
        />

        <main className="flex min-h-[70vh] flex-1 flex-col">
          <header className="flex items-center justify-between border-b border-black/8 px-4 py-3 dark:border-white/10 md:px-6">
            <div>
              <p className="text-xs uppercase tracking-[0.28em] text-[#8a806f] dark:text-[#918676]">
                Claude Code Remote
              </p>
              <h1 className="font-serif text-2xl text-[#332d23] dark:text-[#ede6da]">
                Claude WebUI
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-full border border-black/10 p-2 text-[#6d6251] transition hover:bg-black/5 dark:border-white/10 dark:text-[#d9d0c4] dark:hover:bg-white/6"
                onClick={() => void refreshWorkspace()}
                title="刷新会话"
              >
                <RefreshCw className="size-4" />
              </button>
              <button
                className="rounded-full border border-black/10 p-2 text-[#6d6251] transition hover:bg-black/5 dark:border-white/10 dark:text-[#d9d0c4] dark:hover:bg-white/6"
                onClick={() => setIsDark((current) => !current)}
                title="切换主题"
              >
                {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
              </button>
            </div>
          </header>

          <ChatView
            connectionLabel={connectionLabel}
            draft={draft}
            isDark={isDark}
            onDraftChange={setDraft}
            onSend={handleSend}
            session={activeSession}
            socketReady={socketReady}
            socketStatus={socketStatus}
          />
        </main>
      </div>
    </div>
  );
}

function readStoredTheme(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(THEME_KEY) === "dark";
}

function readStoredActiveSessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }

  return window.localStorage.getItem(ACTIVE_SESSION_KEY);
}

function readStoredSettings(): ConnectionSettings {
  if (typeof window === "undefined") {
    return { baseUrl: getDefaultBaseUrl(), defaultCwd: "", password: "" };
  }

  const raw = window.localStorage.getItem(SETTINGS_KEY);
  if (!raw) {
    return { baseUrl: getDefaultBaseUrl(), defaultCwd: "", password: "" };
  }

  try {
    return JSON.parse(raw) as ConnectionSettings;
  } catch {
    return { baseUrl: getDefaultBaseUrl(), defaultCwd: "", password: "" };
  }
}

function buildConnectionLabel(
  health: HealthResponse | null,
  error: string | null,
): string {
  if (error) {
    return `连接失败 · ${error}`;
  }

  if (!health) {
    return "尚未连接到后端";
  }

  return `后端在线 · ${health.command}`;
}

function buildSocketProgress(attempt: number): SocketStatus {
  if (attempt === 0) {
    return createSocketStatus("connecting", "正在连接会话");
  }

  return createSocketStatus(
    "reconnecting",
    `正在重新连接（${attempt}/${SOCKET_MAX_ATTEMPTS}）`,
    attempt,
  );
}

function toErrorMessage(caughtError: unknown): string {
  if (caughtError instanceof Error) {
    return caughtError.message;
  }

  return "请求失败";
}
