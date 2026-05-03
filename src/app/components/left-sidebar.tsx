import { useState, useRef, useEffect } from "react";
import {
  PanelLeft,
  Plus,
  Search,
  Folder,
  ChevronDown,
  Pencil,
  Settings,
  Maximize2,
  Share2,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import { toast } from "sonner";

import type { SessionSummary } from "../types";

// ── Props ─────────────────────────────────────────────────────────────────────

interface LeftSidebarProps {
  open: boolean;
  width: number;
  onToggle: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
  isDragging: boolean;
  isDark: boolean;
  activeSessionId: string | null;
  setActiveSessionId: (v: string | null) => void;
  appearance: "system" | "light" | "dark";
  setAppearance: (v: "system" | "light" | "dark") => void;
  wideMode: boolean;
  setWideMode: (fn: (w: boolean) => boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  sessions: SessionSummary[];
  onRefresh: () => void;
  onCreateSession: () => void;
  creating: boolean;
  busy: boolean;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LeftSidebar({
  open,
  width,
  onToggle,
  onResizeStart,
  isDragging,
  isDark,
  activeSessionId,
  setActiveSessionId,
  appearance,
  setAppearance,
  wideMode,
  setWideMode,
  setSettingsOpen,
  sessions,
  onRefresh,
  onCreateSession,
  creating,
  busy,
}: LeftSidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [userOpen, setUserOpen] = useState(false);

  const userRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (userRef.current && !userRef.current.contains(e.target as Node))
        setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const D = isDark;
  const hoverBg = D ? "hover:bg-white/8" : "hover:bg-[#ebe7d9]";
  const textPrim = D ? "text-[#e8e3d8]" : "text-[#3d3929]";
  const textSec = D ? "text-[#9a9485]" : "text-[#6b6553]";
  const textMuted = D ? "text-[#6b6553]" : "text-[#a8a294]";
  const borderCol = D ? "border-white/10" : "border-[#e8e4d8]";
  const borderSub = D ? "border-white/8" : "border-[#f0ece0]";

  const popupStyle: React.CSSProperties = {
    background: D ? "rgba(28,26,22,0.97)" : "rgba(255,255,255,0.92)",
    border: D ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,255,255,0.65)",
    boxShadow: D ? "0 12px 40px rgba(0,0,0,0.55)" : "0 12px 40px rgba(61,57,41,0.15)",
    backdropFilter: "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
  };

  const filteredSessions = sessions.filter((s) =>
    s.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!open) return null;

  return (
    <aside
      className={`flex flex-col border-r backdrop-blur-xl relative shrink-0 overflow-hidden ${
        D ? "bg-black/25 border-white/10" : "bg-white/40 border-[#e8e4d8]"
      }`}
      style={{
        width,
        transition: isDragging ? "none" : "width 0.25s cubic-bezier(0.4,0,0.2,1)",
        minWidth: width,
      }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={onResizeStart}
        className="absolute top-0 right-0 w-1 h-full z-20 cursor-col-resize group"
      >
        <div className="w-full h-full group-hover:bg-[#cc6b3f]/25 transition-colors" />
      </div>

      {/* ── Header row: collapse ↔ Claude logo ─────────────────────── */}
      <div className="flex items-center justify-between px-2.5 pt-3 pb-2">
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-md transition active:scale-95 bg-transparent ${hoverBg}`}
          title="折叠侧边栏"
        >
          <PanelLeft className={`w-4 h-4 ${textSec}`} />
        </button>

        {/* Claude asterisk logo */}
        <div className="flex items-center gap-1.5">
          <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#cc6b3f]" fill="currentColor">
            <path
              d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
          <span className={textPrim} style={{ fontSize: 13 }}>Claude</span>
        </div>
      </div>

      {/* ── New chat button ─────────────────────────────────────────── */}
      <div className="px-2 pb-2">
        <button
          onClick={() => {
            setActiveSessionId(null);
            onCreateSession();
          }}
          disabled={creating || busy}
          className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border transition-all active:scale-[0.98] bg-transparent ${
            D
              ? "border-white/10 hover:bg-white/8 text-[#e8e3d8] disabled:opacity-50"
              : "border-[#e8e4d8] hover:bg-white/70 text-[#3d3929] disabled:opacity-50"
          }`}
          style={{ fontSize: 13 }}
        >
          <Plus className={`w-3.5 h-3.5 ${textSec}`} />
          <span>{creating ? "创建中..." : "新会话"}</span>
        </button>
      </div>

      {/* ── Search bar ─────────────────────────────────────────────── */}
      <div className="px-2 pb-2">
        <div
          className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${
            D
              ? "bg-white/5 border-white/10 focus-within:bg-white/8 focus-within:border-white/20"
              : "bg-black/[0.03] border-[#e8e4d8] focus-within:bg-white/70 focus-within:border-[#d9d5c7]"
          }`}
        >
          <Search className={`w-3.5 h-3.5 shrink-0 ${textMuted}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索会话..."
            className={`flex-1 bg-transparent outline-none min-w-0 ${textPrim} ${
              D ? "placeholder-[#6b6553]" : "placeholder-[#a8a294]"
            }`}
            style={{ fontSize: 13 }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className={`shrink-0 bg-transparent transition ${textMuted}`}
              style={{ fontSize: 12, lineHeight: 1 }}
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── History label + edit ───────────────────────────────────── */}
      <div className={`flex items-center justify-between px-3 pb-1.5 border-b ${borderCol}`}>
        <span
          className={textMuted}
          style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}
        >
          最近
        </span>
        <button
          onClick={onRefresh}
          disabled={busy}
          className={`p-1 rounded-md transition bg-transparent ${hoverBg} disabled:opacity-50`}
          title="刷新"
        >
          <Pencil className={`w-3 h-3 ${textMuted}`} />
        </button>
      </div>

      {/* ── Session list ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5">
        {filteredSessions.length > 0 ? (
          filteredSessions.map((s) => (
            <button
              key={s.id}
              onClick={() => setActiveSessionId(s.id)}
              className={`relative w-full text-left px-2.5 py-2 rounded-lg transition bg-transparent group ${
                activeSessionId === s.id
                  ? D ? "bg-white/10" : "bg-black/8"
                  : hoverBg
              }`}
            >
              <div
                className={`truncate ${
                  activeSessionId === s.id
                    ? D ? "text-[#f0ece0]" : "text-[#2d2b22]"
                    : textPrim
                }`}
                style={{ fontSize: 13 }}
              >
                {s.title}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5" style={{ fontSize: 11 }}>
                <Folder
                  className={`w-2.5 h-2.5 shrink-0 ${
                    activeSessionId === s.id ? "text-[#cc6b3f]" : textMuted
                  }`}
                />
                <span
                  className={
                    activeSessionId === s.id ? "text-[#cc6b3f]" : textMuted
                  }
                >
                  {s.cwd.split("/").pop() || s.cwd}
                </span>
                <span className={textMuted}>·</span>
                <span className={textMuted}>{s.status}</span>
              </div>
            </button>
          ))
        ) : (
          <div className={`px-3 py-8 text-center ${textMuted}`} style={{ fontSize: 12 }}>
            {busy ? "加载中..." : "暂无会话"}
          </div>
        )}
      </div>

      {/* ── User / Context footer ───────────────────────────────────── */}
      <div className={`relative border-t ${borderCol}`} ref={userRef}>
        {/* User popup */}
        {userOpen && (
          <div
            className="absolute bottom-full left-1 right-1 mb-2 rounded-2xl overflow-hidden z-30"
            style={popupStyle}
          >
            {/* Appearance toggle */}
            <div className={`px-4 py-3 flex items-center justify-between border-b ${borderSub}`}>
              <span className={textPrim} style={{ fontSize: 13 }}>外观</span>
              <div
                className={`flex items-center rounded-lg p-0.5 gap-0.5 ${
                  D ? "bg-white/10" : "bg-[#f0ece0]"
                }`}
              >
                {([
                  { value: "system", Icon: Monitor },
                  { value: "light", Icon: Sun },
                  { value: "dark", Icon: Moon },
                ] as const).map(({ value, Icon }) => (
                  <button
                    key={value}
                    onClick={() => {
                      setAppearance(value);
                      toast(
                        `外观: ${
                          value === "system"
                            ? "跟随系统"
                            : value === "light"
                            ? "浅色"
                            : "深色"
                        }`
                      );
                    }}
                    className={`p-1.5 rounded-md transition-all bg-transparent ${
                      appearance === value
                        ? D
                          ? "bg-white/20 shadow-sm text-[#e8e3d8]"
                          : "bg-white shadow-sm text-[#3d3929]"
                        : `${textMuted}`
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                ))}
              </div>
            </div>

            {/* Menu items */}
            <div className="py-1">
              <button
                onClick={() => {
                  setWideMode((w) => !w);
                  toast(!wideMode ? "已切换为宽屏模式" : "已切换为标准宽度");
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 transition bg-transparent ${hoverBg} ${
                  wideMode ? "text-[#5b7fb5]" : textPrim
                }`}
              >
                <Maximize2
                  className={`w-4 h-4 ${wideMode ? "text-[#5b7fb5]" : textSec}`}
                />
                <span style={{ fontSize: 14 }}>
                  {wideMode ? "宽屏模式 ✓" : "标准宽度"}
                </span>
              </button>
              <button
                onClick={() => {
                  toast("已生成分享链接");
                  setUserOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 transition bg-transparent ${hoverBg} ${textPrim}`}
              >
                <Share2 className={`w-4 h-4 ${textSec}`} />
                <span style={{ fontSize: 14 }}>分享对话</span>
              </button>
              <button
                onClick={() => {
                  setSettingsOpen(true);
                  setUserOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-2 transition bg-transparent ${hoverBg} ${textPrim}`}
              >
                <Settings className={`w-4 h-4 ${textSec}`} />
                <span style={{ fontSize: 14 }}>设置</span>
              </button>
            </div>

            {/* Connected */}
            <div className={`px-4 py-3 border-t flex items-center gap-2 ${borderSub}`}>
              <span className="w-2 h-2 rounded-full bg-green-500 shrink-0" />
              <span className={textSec} style={{ fontSize: 12 }}>
                已连接
              </span>
            </div>
          </div>
        )}

        {/* Trigger */}
        <button
          onClick={() => setUserOpen((o) => !o)}
          className={`w-full flex items-center gap-2.5 px-3 py-2.5 transition-all active:scale-[0.98] bg-transparent ${hoverBg}`}
        >
          {/* Ring avatar */}
          <div className="relative shrink-0 w-7 h-7">
            <svg viewBox="0 0 36 36" className="w-7 h-7 -rotate-90 absolute inset-0">
              <circle
                cx="18"
                cy="18"
                r="13"
                fill="none"
                stroke={D ? "rgba(255,255,255,0.12)" : "#e8e4d8"}
                strokeWidth="3.5"
              />
              <circle
                cx="18"
                cy="18"
                r="13"
                fill="none"
                stroke="#cc6b3f"
                strokeWidth="3.5"
                strokeDasharray="0 81.7"
                strokeLinecap="round"
              />
            </svg>
            <span
              className={`absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border-2 ${
                D ? "border-[#1a1917]" : "border-[#f5f4ef]"
              }`}
            />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className={textPrim} style={{ fontSize: 12 }}>Claude WebUI</div>
            <div className={textMuted} style={{ fontSize: 11 }}>远程控制</div>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 ${textMuted} transition-transform ${
              userOpen ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>
    </aside>
  );
}