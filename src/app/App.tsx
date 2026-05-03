import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  PanelLeft,
} from "lucide-react";
import { Toaster, toast } from "sonner";

import { ChatView } from "./components/chat-view";
import { LeftSidebar } from "./components/left-sidebar";
import { RightSidebar } from "./components/right-sidebar";
import { SettingsDialog } from "./components/settings-dialog";
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
  ServerEntry,
  ServerEvent,
  SessionDetail,
  SessionSummary,
  SocketStatus,
} from "./types";

const ACTIVE_SESSION_KEY = "claude-webui:active-session-id";
const SETTINGS_KEY = "claude-webui:settings";
const SERVERS_KEY = "claude-webui:servers";
const THEME_KEY = "claude-webui:theme";
const IDLE_SOCKET_STATUS = createSocketStatus("idle", "未连接到会话");

const MIN_SIDEBAR = 180;
const MAX_SIDEBAR = 520;
const MIN_RIGHT = 180;
const MAX_RIGHT = 560;

export default function App() {
  const [appearance, setAppearance] = useState<"system" | "light" | "dark">("system");
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const isDark = appearance === "dark" || (appearance === "system" && systemDark);

  const [settings, setSettings] = useState(readStoredSettings);
  const [servers, setServers] = useState<ServerEntry[]>(readStoredServers);
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

  // Layout state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [rightOpen, setRightOpen] = useState(true);
  const [rightWidth, setRightWidth] = useState(280);
  const [wideMode, setWideMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [isDragging, setIsDragging] = useState<"left" | "right" | null>(null);

  const leftDragStartX = useRef(0);
  const leftDragStartW = useRef(0);
  const rightDragStartX = useRef(0);
  const rightDragStartW = useRef(0);

  // Theme effect
  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    window.localStorage.setItem(THEME_KEY, appearance);
  }, [isDark, appearance]);

  // Settings persistence
  useEffect(() => {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  // Servers persistence
  useEffect(() => {
    window.localStorage.setItem(SERVERS_KEY, JSON.stringify(servers));
  }, [servers]);

  // Sync active server with settings
  useEffect(() => {
    const activeServer = servers.find((s) => s.active);
    if (activeServer && activeServer.url !== settings.baseUrl) {
      setSettings((current) => ({ ...current, baseUrl: activeServer.url }));
    }
  }, [servers]);

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
    [error, health]
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
        nextSessions
      );

      setHealth(nextHealth);
      setSessions(nextSessions);
      setSettings((current) =>
        current.defaultCwd
          ? current
          : { ...current, defaultCwd: nextHealth.defaultCwd }
      );
      setActiveSessionId(nextActiveSessionId);

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
      setActiveSessionId(null);
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
      setActiveSessionId(session.id);
      toast.success("已创建新会话");
    } catch (caughtError) {
      const message = toErrorMessage(caughtError);
      setError(message);
      toast.error(message);
    } finally {
      setCreating(false);
    }
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
          createSocketStatus("error", "连接出错，等待 WebSocket 关闭事件")
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
    event: CloseEvent
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
        nextAttempt
      )
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

  // Resize handlers
  const onMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging === "left") {
        const delta = e.clientX - leftDragStartX.current;
        const newW = Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, leftDragStartW.current + delta));
        setSidebarWidth(newW);
      } else if (isDragging === "right") {
        const delta = rightDragStartX.current - e.clientX;
        const newW = Math.max(MIN_RIGHT, Math.min(MAX_RIGHT, rightDragStartW.current + delta));
        setRightWidth(newW);
      }
    },
    [isDragging]
  );

  const onMouseUp = useCallback(() => setIsDragging(null), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("mouseup", onMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  }, [isDragging, onMouseMove, onMouseUp]);

  const startLeftResize = (e: React.MouseEvent) => {
    e.preventDefault();
    leftDragStartX.current = e.clientX;
    leftDragStartW.current = sidebarWidth;
    setIsDragging("left");
  };

  const startRightResize = (e: React.MouseEvent) => {
    e.preventDefault();
    rightDragStartX.current = e.clientX;
    rightDragStartW.current = rightWidth;
    setIsDragging("right");
  };

  // Server management
  function setActiveServer(id: string) {
    setServers((s) => s.map((x) => ({ ...x, active: x.id === id })));
    toast.success("已切换活跃服务器");
  }

  function addServer(name: string, url: string) {
    const id = String(Date.now());
    setServers((s) => [...s, { id, name, url, active: false }]);
    toast.success("已添加服务器");
  }

  function updateServer(id: string, name: string, url: string) {
    setServers((s) => s.map((x) => (x.id === id ? { ...x, name, url } : x)));
    toast.success("已更新服务器");
  }

  function removeServer(id: string) {
    setServers((s) => s.filter((x) => x.id !== id));
    toast("已删除服务器");
  }

  return (
    <div
      className={`size-full flex relative overflow-hidden ${isDark ? "dark" : ""}`}
      style={{
        fontFamily: "ui-sans-serif, system-ui, sans-serif",
        userSelect: isDragging ? "none" : undefined,
        cursor: isDragging ? "col-resize" : undefined,
        background: isDark
          ? "radial-gradient(circle at 0% 0%, #1e1c18 0%, #1a1917 40%, #1c1b16 100%)"
          : "radial-gradient(circle at 0% 0%, #f7f3e9 0%, #f5f4ef 40%, #f3efe4 100%)",
      }}
    >
      {/* Ambient orbs */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full opacity-50"
        style={{
          background: isDark
            ? "radial-gradient(circle, #3d2a1e 0%, rgba(61,42,30,0) 70%)"
            : "radial-gradient(circle, #f3c6a8 0%, rgba(243,198,168,0) 70%)",
          filter: "blur(80px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full opacity-40"
        style={{
          background: isDark
            ? "radial-gradient(circle, #1e1a2e 0%, rgba(30,26,46,0) 70%)"
            : "radial-gradient(circle, #d9c8e8 0%, rgba(217,200,232,0) 70%)",
          filter: "blur(90px)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-48 left-1/3 w-[640px] h-[640px] rounded-full opacity-35"
        style={{
          background: isDark
            ? "radial-gradient(circle, #162018 0%, rgba(22,32,24,0) 70%)"
            : "radial-gradient(circle, #cfe0d4 0%, rgba(207,224,212,0) 70%)",
          filter: "blur(100px)",
        }}
      />

      <Toaster position="bottom-right" />

      {isDragging && <div className="fixed inset-0 z-[999] cursor-col-resize" />}

      {/* ── Left Sidebar ── */}
      {sidebarOpen && (
        <LeftSidebar
          open={sidebarOpen}
          width={sidebarWidth}
          onToggle={() => setSidebarOpen(false)}
          onResizeStart={startLeftResize}
          isDragging={isDragging === "left"}
          isDark={isDark}
          activeSessionId={activeSessionId}
          setActiveSessionId={setActiveSessionId}
          appearance={appearance}
          setAppearance={setAppearance}
          wideMode={wideMode}
          setWideMode={setWideMode}
          setSettingsOpen={setSettingsOpen}
          sessions={sessions}
          onRefresh={() => void refreshWorkspace()}
          onCreateSession={handleCreateSession}
          creating={creating}
          busy={busy}
        />
      )}

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col relative min-w-0 z-[1]">
        {!sidebarOpen && (
          <button
            onClick={() => {
              setSidebarOpen(true);
              toast.success("已展开侧边栏");
            }}
            className="absolute top-4 left-4 p-1.5 rounded-md hover:bg-[#ebe7d9] dark:hover:bg-white/8 transition active:scale-95 z-10 bg-transparent"
          >
            <PanelLeft className="w-4 h-4 text-[#6b6553] dark:text-[#9a9485]" />
          </button>
        )}

        <ChatView
          connectionLabel={connectionLabel}
          draft={draft}
          isDark={isDark}
          onDraftChange={setDraft}
          onSend={handleSend}
          session={activeSession}
          socketReady={socketReady}
          socketStatus={socketStatus}
          wideMode={wideMode}
          onToggleRight={() => setRightOpen((o) => !o)}
          rightOpen={rightOpen}
        />
      </main>

      {/* Right sidebar */}
      {activeSession && (
        <RightSidebar
          open={rightOpen}
          width={rightWidth}
          onToggle={() => setRightOpen((o) => !o)}
          onResizeStart={startRightResize}
          isDragging={isDragging === "right"}
          isDark={isDark}
        />
      )}

      <SettingsDialog
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        isDark={isDark}
        servers={servers}
        onSetActiveServer={setActiveServer}
        onAddServer={addServer}
        onUpdateServer={updateServer}
        onRemoveServer={removeServer}
      />
    </div>
  );
}

// ── Helper functions ───────────────────────────────────────────────────────────

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

function readStoredServers(): ServerEntry[] {
  if (typeof window === "undefined") {
    return [{ id: "1", name: "Local", url: "http://127.0.0.1:4096", active: true }];
  }

  const raw = window.localStorage.getItem(SERVERS_KEY);
  if (!raw) {
    return [{ id: "1", name: "Local", url: "http://127.0.0.1:4096", active: true }];
  }

  try {
    return JSON.parse(raw) as ServerEntry[];
  } catch {
    return [{ id: "1", name: "Local", url: "http://127.0.0.1:4096", active: true }];
  }
}

function readStoredActiveSessionId(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  return window.localStorage.getItem(ACTIVE_SESSION_KEY);
}

function buildConnectionLabel(
  health: HealthResponse | null,
  error: string | null
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
    attempt
  );
}

function toErrorMessage(caughtError: unknown): string {
  if (caughtError instanceof Error) {
    return caughtError.message;
  }
  return "请求失败";
}