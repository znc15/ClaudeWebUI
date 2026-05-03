import { useState, useRef, useEffect } from "react";
import {
  PanelLeft,
  Plus,
  Search,
  Globe,
  Folder,
  FolderOpen,
  ChevronDown,
  ChevronRight,
  Check,
  Pencil,
  Settings,
  Maximize2,
  Share2,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import { toast } from "sonner";

// ── Static data ───────────────────────────────────────────────────────────────

const workspaces = [
  {
    id: "global",
    name: "Global",
    branch: null as string | null,
    path: "非 Git 项目，通常是 opencode 启动目录",
    icon: "globe",
  },
  {
    id: "flowvision",
    name: "FlowVision",
    branch: "main",
    path: "O:/Projects/FlowVision",
    icon: "folder",
  },
  {
    id: "opencodeflow",
    name: "OpenCodeFlow",
    branch: "main",
    path: "O:/Projects/OpenCodeFlow",
    icon: "folder",
  },
  {
    id: "opencode",
    name: "OpenCode",
    branch: "dev",
    path: "C:/Users/YangXiaoMian/AppData/Local/OpenCode",
    icon: "folder",
  },
];

const historyItems = [
  { id: "agent",    label: "Agent驱动项目成果描述",            project: "FlowVision",    date: "5/3"  },
  { id: "newapi",   label: "NewAPI二次元风格首页设计",          project: "FlowVision",    date: "5/2"  },
  { id: "ios18",    label: "iOS 18风格动画天气卡片",            project: "FlowVision",    date: "5/2"  },
  { id: "weather1", label: "天气卡设计",                        project: "FlowVision",    date: "5/1"  },
  { id: "weather2", label: "天气卡组件开发",                    project: "FlowVision",    date: "5/1"  },
  { id: "download", label: "现代化下载站单页设计",              project: "OpenCodeFlow",  date: "4/30" },
  { id: "mtproto",  label: "MTPROTO over Cloudflare Tunnel...", project: "OpenCode",       date: "4/29" },
  { id: "pm",       label: "构建可安装的项目管理平台规划",      project: "OpenCodeFlow",  date: "4/29" },
  { id: "ui",       label: "页面美化与UI框架集成",              project: "FlowVision",    date: "4/28" },
  { id: "flow",     label: "项目流程图一键分析工具",            project: "OpenCodeFlow",  date: "4/27" },
  { id: "freq",     label: "Freqtrade项目分析",                 project: "OpenCode",       date: "4/26" },
  { id: "nano",     label: "后台启动nanobot项目",               project: "OpenCode",       date: "4/25" },
  { id: "lstm",     label: "LSTM预测BTC波动的MCP服务器实现",    project: "OpenCodeFlow",  date: "4/24" },
];

const activeProjects = [
  { id: "opencodeflow", name: "OpenCodeFlow", path: "O:/Projects/OpenCodeFlow"                        },
  { id: "lstm-mcp",     name: "LSTM-MCP",     path: "O:/Projects/LSTM-MCP"                            },
  { id: "c-root",       name: "C:",           path: "C:/"                                              },
  { id: "opencode",     name: "OpenCode",     path: "C:/Users/YangXiaoMian/AppData/Local/OpenCode"    },
  { id: "flowvision",   name: "FlowVision",   path: "O:/Projects/FlowVision"                          },
];

// ── Props ─────────────────────────────────────────────────────────────────────

interface LeftSidebarProps {
  open: boolean;
  width: number;
  onToggle: () => void;
  onResizeStart: (e: React.MouseEvent) => void;
  isDragging: boolean;
  isDark: boolean;
  activeRecent: string | null;
  setActiveRecent: (v: string | null) => void;
  appearance: "system" | "light" | "dark";
  setAppearance: (v: "system" | "light" | "dark") => void;
  wideMode: boolean;
  setWideMode: (fn: (w: boolean) => boolean) => void;
  setSettingsOpen: (v: boolean) => void;
  setCtxOpen: (v: boolean) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LeftSidebar({
  open,
  width,
  onToggle,
  onResizeStart,
  isDragging,
  isDark,
  activeRecent,
  setActiveRecent,
  appearance,
  setAppearance,
  wideMode,
  setWideMode,
  setSettingsOpen,
  setCtxOpen,
}: LeftSidebarProps) {
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [selectedWs, setSelectedWs]       = useState(workspaces[1]); // FlowVision · main
  const [searchQuery, setSearchQuery]     = useState("");
  const [historyTab, setHistoryTab]       = useState<"recent" | "active">("recent");
  const [userOpen, setUserOpen]           = useState(false);

  const workspaceRef = useRef<HTMLDivElement>(null);
  const userRef      = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (workspaceRef.current && !workspaceRef.current.contains(e.target as Node))
        setWorkspaceOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node))
        setUserOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const D = isDark;
  const hoverBg    = D ? "hover:bg-white/8"  : "hover:bg-[#ebe7d9]";
  const activeBg   = D ? "bg-white/10"        : "bg-[#ebe7d9]";
  const textPrim   = D ? "text-[#e8e3d8]"     : "text-[#3d3929]";
  const textSec    = D ? "text-[#9a9485]"     : "text-[#6b6553]";
  const textMuted  = D ? "text-[#6b6553]"     : "text-[#a8a294]";
  const borderCol  = D ? "border-white/10"    : "border-[#e8e4d8]";
  const borderSub  = D ? "border-white/8"     : "border-[#f0ece0]";

  const popupStyle: React.CSSProperties = {
    background:         D ? "rgba(28,26,22,0.97)"             : "rgba(255,255,255,0.92)",
    border:             D ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,255,255,0.65)",
    boxShadow:          D ? "0 12px 40px rgba(0,0,0,0.55)"    : "0 12px 40px rgba(61,57,41,0.15)",
    backdropFilter:     "blur(24px) saturate(180%)",
    WebkitBackdropFilter: "blur(24px) saturate(180%)",
  };

  const filteredHistory = historyItems.filter((h) =>
    h.label.toLowerCase().includes(searchQuery.toLowerCase())
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
            <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"
              stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
          </svg>
          <span className={`${textPrim}`} style={{ fontSize: 13 }}>Claude</span>
        </div>
      </div>

      {/* ── New chat button ─────────────────────────────────────────── */}
      <div className="px-2 pb-2">
        <button
          onClick={() => { setActiveRecent(null); toast.success("已开始新对话"); }}
          className={`w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border transition-all active:scale-[0.98] bg-transparent ${
            D
              ? "border-white/10 hover:bg-white/8 text-[#e8e3d8]"
              : "border-[#e8e4d8] hover:bg-white/70 text-[#3d3929]"
          }`}
          style={{ fontSize: 13 }}
        >
          <Plus className={`w-3.5 h-3.5 ${textSec}`} />
          <span>新对话</span>
        </button>
      </div>

      {/* ── Workspace Selector ─────────────────────────────────────── */}
      <div className="px-2 pb-2" ref={workspaceRef}>
        <button
          onClick={() => setWorkspaceOpen((o) => !o)}
          className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all active:scale-[0.98] bg-transparent ${
            D
              ? "border-white/10 hover:bg-white/6 hover:border-white/18"
              : "border-[#e8e4d8] hover:bg-white/70 hover:border-[#d9d5c7]"
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5 text-[#cc6b3f] shrink-0" />
          <div className="flex-1 text-left min-w-0">
            <span className={`${textPrim}`} style={{ fontSize: 13 }}>
              {selectedWs.name}
              {selectedWs.branch && (
                <span className={`ml-1 ${textMuted}`}>· {selectedWs.branch}</span>
              )}
            </span>
          </div>
          <ChevronDown
            className={`w-3.5 h-3.5 shrink-0 transition-transform ${textMuted} ${workspaceOpen ? "rotate-180" : ""}`}
          />
        </button>

        {/* Dropdown */}
        {workspaceOpen && (
          <div
            className="absolute left-2 right-2 z-40 rounded-xl overflow-hidden"
            style={{ top: "calc(3rem + 3.25rem)", ...popupStyle }}
          >
            {/* Global option */}
            <div className={`px-1 pt-1.5 pb-1 border-b ${borderSub}`}>
              <button
                onClick={() => { setSelectedWs(workspaces[0]); setWorkspaceOpen(false); toast("已切换到 Global 工作区"); }}
                className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg transition text-left bg-transparent ${
                  selectedWs.id === "global" ? (D ? "bg-white/10" : "bg-[#f0ece0]") : hoverBg
                }`}
              >
                <Globe className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${textSec}`} />
                <div className="min-w-0 flex-1">
                  <div className={`${textPrim} flex items-center gap-1.5`} style={{ fontSize: 13 }}>
                    Global
                    {selectedWs.id === "global" && <Check className="w-3 h-3 text-[#5b7fb5]" />}
                  </div>
                  <div className={textMuted} style={{ fontSize: 11 }}>{workspaces[0].path}</div>
                </div>
              </button>
            </div>

            {/* Local projects */}
            <div className="px-1 py-1">
              {workspaces.slice(1).map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => { setSelectedWs(ws); setWorkspaceOpen(false); toast(`已切换到 ${ws.name} · ${ws.branch}`); }}
                  className={`w-full flex items-start gap-2.5 px-3 py-2 rounded-lg transition text-left bg-transparent ${
                    selectedWs.id === ws.id ? (D ? "bg-white/10" : "bg-[#f0ece0]") : hoverBg
                  }`}
                >
                  <Folder className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${selectedWs.id === ws.id ? "text-[#cc6b3f]" : textSec}`} />
                  <div className="flex-1 min-w-0">
                    <div className={`flex items-center gap-1 ${textPrim}`} style={{ fontSize: 13 }}>
                      <span className="truncate">{ws.name}</span>
                      {ws.branch && <span className={textMuted}>· {ws.branch}</span>}
                    </div>
                    <div className={`truncate ${textMuted}`} style={{ fontSize: 11, fontFamily: "ui-monospace, monospace" }}>
                      {ws.path}
                    </div>
                  </div>
                  {selectedWs.id === ws.id && <Check className="w-3.5 h-3.5 text-[#5b7fb5] shrink-0 mt-0.5" />}
                </button>
              ))}
            </div>

            {/* Add project */}
            <div className={`border-t px-1 py-1 ${borderSub}`}>
              <button
                onClick={() => { setWorkspaceOpen(false); toast("添加新项目..."); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition text-left bg-transparent ${hoverBg}`}
                style={{ fontSize: 13 }}
              >
                <Plus className={`w-3.5 h-3.5 ${textSec}`} />
                <span className={textSec}>添加项目...</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Search bar ─────────────────────────────────────────────── */}
      <div className="px-2 pb-2">
        <div className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border transition-all ${
          D
            ? "bg-white/5 border-white/10 focus-within:bg-white/8 focus-within:border-white/20"
            : "bg-black/[0.03] border-[#e8e4d8] focus-within:bg-white/70 focus-within:border-[#d9d5c7]"
        }`}>
          <Search className={`w-3.5 h-3.5 shrink-0 ${textMuted}`} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索对话..."
            className={`flex-1 bg-transparent outline-none min-w-0 ${textPrim} ${D ? "placeholder-[#6b6553]" : "placeholder-[#a8a294]"}`}
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
        <span className={`${textMuted}`} style={{ fontSize: 11, letterSpacing: "0.04em", textTransform: "uppercase" }}>
          最近
        </span>
        <button
          onClick={() => toast("编辑列表")}
          className={`p-1 rounded-md transition bg-transparent ${hoverBg}`}
          title="编辑"
        >
          <Pencil className={`w-3 h-3 ${textMuted}`} />
        </button>
      </div>

      {/* ── Conversation list ───────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-2 py-1.5">
        {filteredHistory.length > 0 ? (
          filteredHistory.map((h) => (
            <button
              key={h.id}
              onClick={() => { setActiveRecent(h.label); toast(`打开: ${h.label}`); }}
              className={`relative w-full text-left px-2.5 py-2 rounded-lg transition bg-transparent group ${
                activeRecent === h.label
                  ? D ? "bg-white/10" : "bg-black/8"
                  : hoverBg
              }`}
            >
              <div className={`truncate ${activeRecent === h.label ? (D ? "text-[#f0ece0]" : "text-[#2d2b22]") : textPrim}`} style={{ fontSize: 13 }}>
                {h.label}
              </div>
              <div className={`flex items-center gap-1.5 mt-0.5`} style={{ fontSize: 11 }}>
                <Folder className={`w-2.5 h-2.5 shrink-0 ${activeRecent === h.label ? "text-[#cc6b3f]" : textMuted}`} />
                <span className={activeRecent === h.label ? "text-[#cc6b3f]" : textMuted}>{h.project}</span>
                <span className={textMuted}>·</span>
                <span className={textMuted}>{h.date}</span>
              </div>
            </button>
          ))
        ) : (
          <div className={`px-3 py-8 text-center ${textMuted}`} style={{ fontSize: 12 }}>
            无匹配对话
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
            {/* Context usage */}
            <div className={`px-4 pt-4 pb-3 border-b ${borderSub}`}>
              <div className="flex items-center justify-between mb-2">
                <span className={textPrim} style={{ fontSize: 13 }}>上下文用量</span>
                <div className="flex items-center gap-2">
                  <span className={textPrim} style={{ fontSize: 13 }}>0%</span>
                  <button
                    onClick={() => { setCtxOpen(true); setUserOpen(false); }}
                    className="px-2 py-0.5 rounded-md text-[#5b7fb5] bg-[#e9eef7] hover:bg-[#dde6f3] dark:bg-[#5b7fb5]/15 dark:hover:bg-[#5b7fb5]/25 transition active:scale-95 bg-transparent"
                    style={{ fontSize: 11 }}
                  >
                    查看详情
                  </button>
                </div>
              </div>
              <div className={`w-full h-1.5 rounded-full mb-2 ${D ? "bg-white/10" : "bg-[#f0ece0]"}`}>
                <div className="h-full rounded-full bg-[#cc6b3f]" style={{ width: "0%" }} />
              </div>
              <div className="flex items-center justify-between">
                <span className={textMuted} style={{ fontSize: 11 }}>0 / 400.0k</span>
                <span className={textMuted} style={{ fontSize: 11 }}>$0</span>
              </div>
            </div>

            {/* Appearance toggle */}
            <div className={`px-4 py-3 flex items-center justify-between border-b ${borderSub}`}>
              <span className={textPrim} style={{ fontSize: 13 }}>外观</span>
              <div className={`flex items-center rounded-lg p-0.5 gap-0.5 ${D ? "bg-white/10" : "bg-[#f0ece0]"}`}>
                {([
                  { value: "system", Icon: Monitor },
                  { value: "light",  Icon: Sun    },
                  { value: "dark",   Icon: Moon   },
                ] as const).map(({ value, Icon }) => (
                  <button
                    key={value}
                    onClick={() => { setAppearance(value); toast(`外观: ${value === "system" ? "跟随系统" : value === "light" ? "浅色" : "深色"}`); }}
                    className={`p-1.5 rounded-md transition-all bg-transparent ${
                      appearance === value
                        ? D ? "bg-white/20 shadow-sm text-[#e8e3d8]" : "bg-white shadow-sm text-[#3d3929]"
                        : `${textMuted} hover:${textSec}`
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
                onClick={() => { setWideMode(w => !w); toast(!wideMode ? "已切换为宽屏模式" : "已切换为标准宽度"); }}
                className={`w-full flex items-center gap-3 px-4 py-2 transition bg-transparent ${hoverBg} ${wideMode ? "text-[#5b7fb5]" : textPrim}`}
              >
                <Maximize2 className={`w-4 h-4 ${wideMode ? "text-[#5b7fb5]" : textSec}`} />
                <span style={{ fontSize: 14 }}>{wideMode ? "宽屏模式 ✓" : "标准宽度"}</span>
              </button>
              <button
                onClick={() => { toast("已生成分享链接"); setUserOpen(false); }}
                className={`w-full flex items-center gap-3 px-4 py-2 transition bg-transparent ${hoverBg} ${textPrim}`}
              >
                <Share2 className={`w-4 h-4 ${textSec}`} />
                <span style={{ fontSize: 14 }}>分享对话</span>
              </button>
              <button
                onClick={() => { setSettingsOpen(true); setUserOpen(false); }}
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
                Connected · {selectedWs.name}
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
              <circle cx="18" cy="18" r="13" fill="none" stroke={D ? "rgba(255,255,255,0.12)" : "#e8e4d8"} strokeWidth="3.5" />
              <circle cx="18" cy="18" r="13" fill="none" stroke="#cc6b3f" strokeWidth="3.5" strokeDasharray="0 81.7" strokeLinecap="round" />
            </svg>
            <span className={`absolute bottom-0 right-0 w-2 h-2 rounded-full bg-green-500 border-2 ${D ? "border-[#1a1917]" : "border-[#f5f4ef]"}`} />
          </div>
          <div className="flex-1 text-left min-w-0">
            <div className={textPrim} style={{ fontSize: 12 }}>0 / 400.0k</div>
            <div className={textMuted} style={{ fontSize: 11 }}>0%</div>
          </div>
          <ChevronDown className={`w-3.5 h-3.5 ${textMuted} transition-transform ${userOpen ? "rotate-180" : ""}`} />
        </button>
      </div>
    </aside>
  );
}