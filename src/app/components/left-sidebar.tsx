import { Activity, FolderPlus, KeyRound, Link2, RefreshCw } from "lucide-react";

import type { HealthResponse, SessionSummary } from "../types";

interface LeftSidebarProps {
  activeSessionId: string | null;
  busy: boolean;
  connectionLabel: string;
  creating: boolean;
  defaultCwd: string;
  error: string | null;
  health: HealthResponse | null;
  isDark: boolean;
  onBaseUrlChange: (value: string) => void;
  onCreateSession: () => void;
  onDefaultCwdChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onRefresh: () => void;
  onSelectSession: (sessionId: string) => void;
  password: string;
  sessions: SessionSummary[];
}

export function LeftSidebar({
  activeSessionId,
  busy,
  connectionLabel,
  creating,
  defaultCwd,
  error,
  health,
  isDark,
  onBaseUrlChange,
  onCreateSession,
  onDefaultCwdChange,
  onPasswordChange,
  onRefresh,
  onSelectSession,
  password,
  sessions,
}: LeftSidebarProps) {
  const panel = isDark
    ? "border-white/10 bg-[#1b1b1b] text-[#ece4d7]"
    : "border-black/8 bg-[#f8f4ec] text-[#2f291f]";
  const muted = isDark ? "text-[#a79c8d]" : "text-[#7b705f]";
  const input = isDark
    ? "border-white/10 bg-white/5 text-[#f2eadf] placeholder:text-[#7d7368]"
    : "border-black/10 bg-white/80 text-[#2f291f] placeholder:text-[#988d7d]";

  return (
    <aside className={`w-full border-r md:max-w-sm ${panel}`}>
      <div className="space-y-6 p-4 md:p-5">
        <div>
          <p className={`text-xs uppercase tracking-[0.24em] ${muted}`}>Remote Target</p>
          <div className="mt-3 space-y-3">
            <LabeledField
              icon={<Link2 className="size-4" />}
              inputClassName={input}
              label="后端地址"
              onChange={onBaseUrlChange}
              placeholder="http://192.168.1.2:4096"
            />
            <LabeledField
              icon={<KeyRound className="size-4" />}
              inputClassName={input}
              label="访问密码"
              onChange={onPasswordChange}
              placeholder="留空表示无认证"
              type="password"
              value={password}
            />
            <LabeledField
              icon={<FolderPlus className="size-4" />}
              inputClassName={input}
              label="新会话目录"
              onChange={onDefaultCwdChange}
              placeholder={health?.defaultCwd ?? "使用后端默认目录"}
              value={defaultCwd}
            />
          </div>
          <div className="mt-3 flex gap-2">
            <ActionButton
              label={busy ? "刷新中..." : "刷新"}
              onClick={onRefresh}
              primary={false}
            >
              <RefreshCw className="size-4" />
            </ActionButton>
            <ActionButton
              label={creating ? "创建中..." : "新会话"}
              onClick={onCreateSession}
              primary
            >
              <FolderPlus className="size-4" />
            </ActionButton>
          </div>
        </div>

        <div
          className={`rounded-3xl border p-4 ${
            isDark ? "border-white/10 bg-white/5" : "border-black/8 bg-white/80"
          }`}
        >
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-[#cc6b3f]" />
            <p className="font-medium">{connectionLabel}</p>
          </div>
          <p className={`mt-2 text-sm ${muted}`}>
            {health
              ? `默认命令 ${health.command}，鉴权 ${health.authRequired ? "已开启" : "已关闭"}`
              : "请先确认后端正在运行并允许当前设备访问。"}
          </p>
          {error ? <p className="mt-2 text-sm text-[#d46a5d]">{error}</p> : null}
        </div>

        <div>
          <div className="mb-3 flex items-center justify-between">
            <p className={`text-xs uppercase tracking-[0.24em] ${muted}`}>Sessions</p>
            <span className={`text-sm ${muted}`}>{sessions.length}</span>
          </div>
          <div className="space-y-2">
            {sessions.map((session) => {
              const active = session.id === activeSessionId;
              return (
                <button
                  key={session.id}
                  className={`w-full rounded-3xl border p-4 text-left transition ${
                    active
                      ? "border-[#cc6b3f]/60 bg-[#cc6b3f]/10"
                      : isDark
                        ? "border-white/10 bg-white/4 hover:bg-white/7"
                        : "border-black/8 bg-white/70 hover:bg-white"
                  }`}
                  onClick={() => onSelectSession(session.id)}
                >
                  <div className="flex items-center justify-between gap-3">
                    <p className="truncate font-medium">{session.title}</p>
                    <StatusBadge isDark={isDark} status={session.status} />
                  </div>
                  <p className={`mt-1 truncate text-sm ${muted}`}>{session.cwd}</p>
                  <p className={`mt-2 line-clamp-2 text-sm ${muted}`}>
                    {session.lastMessagePreview || "会话还没有消息"}
                  </p>
                </button>
              );
            })}
            {sessions.length === 0 ? (
              <div
                className={`rounded-3xl border border-dashed p-5 text-sm ${muted} ${
                  isDark ? "border-white/12 bg-white/3" : "border-black/10 bg-white/60"
                }`}
              >
                还没有可用会话。确认后端连接成功后，点击“新会话”即可开始。
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </aside>
  );
}

function ActionButton({
  children,
  label,
  onClick,
  primary,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  primary: boolean;
}) {
  return (
    <button
      className={`inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
        primary
          ? "bg-[#cc6b3f] text-white hover:bg-[#b85f37]"
          : "border border-black/10 bg-transparent text-current hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/6"
      }`}
      onClick={onClick}
    >
      {children}
      {label}
    </button>
  );
}

function LabeledField({
  icon,
  inputClassName,
  label,
  onChange,
  placeholder,
  type = "text",
  value,
}: {
  icon: React.ReactNode;
  inputClassName: string;
  label: string;
  onChange: (value: string) => void;
  placeholder: string;
  type?: string;
  value?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-center gap-2 text-sm font-medium">
        {icon}
        {label}
      </span>
      <input
        className={`w-full rounded-2xl border px-4 py-2.5 text-sm outline-none transition focus:border-[#cc6b3f]/70 ${inputClassName}`}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type={type}
        value={value}
      />
    </label>
  );
}

function StatusBadge({
  isDark,
  status,
}: {
  isDark: boolean;
  status: SessionSummary["status"];
}) {
  const palette =
    status === "running"
      ? "bg-[#dcefd9] text-[#35603d] dark:bg-[#35513a] dark:text-[#d5f0d2]"
      : status === "exited"
        ? "bg-[#f3d8d2] text-[#8a4336] dark:bg-[#5a322b] dark:text-[#f3d4cb]"
        : "bg-[#e7e2db] text-[#6f6250] dark:bg-[#37322c] dark:text-[#dbd2c6]";

  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium ${palette} ${
        isDark ? "" : ""
      }`}
    >
      {status}
    </span>
  );
}
