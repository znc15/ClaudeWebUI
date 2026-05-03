import { useState, useRef, useEffect, useCallback } from "react";
import {
  PanelLeft,
  Plus,
  Search,
  ChevronDown,
  ChevronRight,
  Check,
  PenLine,
  Coffee,
  Settings,
  Maximize2,
  Share2 as ShareIcon,
  Monitor,
  Sun,
  Moon,
} from "lucide-react";
import { Toaster, toast } from "sonner";
import { ChatView } from "./components/chat-view";
import { SettingsDialog } from "./components/settings-dialog";
import { ContextDetailsDialog } from "./components/context-details-dialog";
import { RightSidebar } from "./components/right-sidebar";
import { LeftSidebar } from "./components/left-sidebar";

const recents = [
  "Agent驱动项目成果描述",
  "NewAPI二次元风格首页设计",
  "iOS 18风格动画天气卡片",
  "天气卡设计",
  "天气卡组件开发",
  "现代化下载站单页设计",
  "MTPROTO over Cloudflare Tunnel...",
  "构建可安装的项目管理平台规划",
  "页面美化与UI框架集成",
  "项目流程图一键分析工具",
  "Freqtrade项目分析",
  "后台启动nanobot项目",
  "Trellis real-world guide document...",
  "调整比例大小",
  "LSTM预测BTC波动的MCP服务器实现",
];

const quickActions = [
  { icon: PenLine, label: "Write" },
  { icon: Coffee, label: "Life stuff" },
];

const models = [
  { name: "Opus 4.7", desc: "Most capable for ambitious work", upgrade: true },
  { name: "Sonnet 4.6", desc: "Most efficient for everyday tasks" },
  { name: "Haiku 4.5", desc: "Fastest for quick answers" },
];

function Asterisk() {
  return (
    <svg viewBox="0 0 24 24" className="w-7 h-7 text-[#cc6b3f]" fill="currentColor">
      <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const MIN_SIDEBAR = 180;
const MAX_SIDEBAR = 520;
const MIN_RIGHT = 180;
const MAX_RIGHT = 560;

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [rightWidth, setRightWidth] = useState(280);
  const [input, setInput] = useState("");
  const [modelOpen, setModelOpen] = useState(false);
  const [userOpen, setUserOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Sonnet 4.6");
  const [adaptive, setAdaptive] = useState(true);
  const [activeRecent, setActiveRecent] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [appearance, setAppearance] = useState<"system" | "light" | "dark">("system");
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
  );
  const [wideMode, setWideMode] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [ctxOpen, setCtxOpen] = useState(false);
  const [rightOpen, setRightOpen] = useState(true);
  const [isDragging, setIsDragging] = useState<"left" | "right" | null>(null);
  const [thinkingDepth, setThinkingDepth] = useState<"关闭" | "自动" | "低" | "中" | "高">("自动");
  const [thinkDepthOpen, setThinkDepthOpen] = useState(false);

  const modelRef = useRef<HTMLDivElement>(null);
  const userRef = useRef<HTMLDivElement>(null);
  const thinkDepthRef = useRef<HTMLDivElement>(null);

  const leftDragStartX = useRef(0);
  const leftDragStartW = useRef(0);
  const rightDragStartX = useRef(0);
  const rightDragStartW = useRef(0);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false);
      if (userRef.current && !userRef.current.contains(e.target as Node)) setUserOpen(false);
      if (thinkDepthRef.current && !thinkDepthRef.current.contains(e.target as Node)) setThinkDepthOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = (e: MediaQueryListEvent) => setSystemDark(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const isDark = appearance === "dark" || (appearance === "system" && systemDark);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging === "left") {
      const delta = e.clientX - leftDragStartX.current;
      const newW = Math.max(MIN_SIDEBAR, Math.min(MAX_SIDEBAR, leftDragStartW.current + delta));
      setSidebarWidth(newW);
    } else if (isDragging === "right") {
      const delta = rightDragStartX.current - e.clientX;
      const newW = Math.max(MIN_RIGHT, Math.min(MAX_RIGHT, rightDragStartW.current + delta));
      setRightWidth(newW);
    }
  }, [isDragging]);

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

  const click = (msg: string) => toast(msg);

  const send = () => {
    if (!input.trim()) { toast("请输入消息内容"); return; }
    toast.success(`已发送: ${input.slice(0, 30)}${input.length > 30 ? "..." : ""}`);
    setInput("");
  };

  // Glass dropdown style helper
  const glassStyle = (dark: boolean) => ({
    background: dark
      ? "linear-gradient(145deg, rgba(40,37,30,0.97) 0%, rgba(28,26,22,0.95) 100%)"
      : "linear-gradient(145deg, rgba(255,255,255,0.82) 0%, rgba(245,243,235,0.78) 100%)",
    backdropFilter: "blur(28px) saturate(180%)",
    WebkitBackdropFilter: "blur(28px) saturate(180%)",
    border: dark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,255,255,0.72)",
    boxShadow: dark
      ? "0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)"
      : "0 8px 32px rgba(61,57,41,0.13), 0 2px 8px rgba(61,57,41,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
  } as React.CSSProperties);

  const hoverRow = (dark: boolean) => ({
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.background = dark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.55)";
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.background = "transparent";
    },
  });

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
      <div aria-hidden className="pointer-events-none absolute -top-40 -left-32 w-[520px] h-[520px] rounded-full opacity-50"
        style={{ background: isDark ? "radial-gradient(circle, #3d2a1e 0%, rgba(61,42,30,0) 70%)" : "radial-gradient(circle, #f3c6a8 0%, rgba(243,198,168,0) 70%)", filter: "blur(80px)" }} />
      <div aria-hidden className="pointer-events-none absolute top-1/3 -right-40 w-[600px] h-[600px] rounded-full opacity-40"
        style={{ background: isDark ? "radial-gradient(circle, #1e1a2e 0%, rgba(30,26,46,0) 70%)" : "radial-gradient(circle, #d9c8e8 0%, rgba(217,200,232,0) 70%)", filter: "blur(90px)" }} />
      <div aria-hidden className="pointer-events-none absolute -bottom-48 left-1/3 w-[640px] h-[640px] rounded-full opacity-35"
        style={{ background: isDark ? "radial-gradient(circle, #162018 0%, rgba(22,32,24,0) 70%)" : "radial-gradient(circle, #cfe0d4 0%, rgba(207,224,212,0) 70%)", filter: "blur(100px)" }} />

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
          activeRecent={activeRecent}
          setActiveRecent={setActiveRecent}
          appearance={appearance}
          setAppearance={setAppearance}
          wideMode={wideMode}
          setWideMode={setWideMode}
          setSettingsOpen={setSettingsOpen}
          setCtxOpen={setCtxOpen}
        />
      )}

      {/* ── Main ── */}
      <main className="flex-1 flex flex-col relative min-w-0 z-[1]">
        {!sidebarOpen && (
          <button
            onClick={() => { setSidebarOpen(true); click("已展开侧边栏"); }}
            className="absolute top-4 left-4 p-1.5 rounded-md hover:bg-[#ebe7d9] dark:hover:bg-white/8 transition active:scale-95 z-10 bg-transparent"
          >
            <PanelLeft className="w-4 h-4 text-[#6b6553] dark:text-[#9a9485]" />
          </button>
        )}

        {activeRecent ? (
          <ChatView
            title={activeRecent}
            wideMode={wideMode}
            isDark={isDark}
            onToggleRight={() => setRightOpen(o => !o)}
            rightOpen={rightOpen}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-12">
            <div className="flex items-center gap-3 mb-8">
              <Asterisk />
              <h1 className="text-[#3d3929] dark:text-[#e8e3d8]" style={{ fontFamily: "Georgia, serif", fontSize: 34, fontWeight: 400 }}>
                Back at it, YangXiaoMian
              </h1>
            </div>

            {/* Input */}
            <div className={`claude-input-glow w-full ${wideMode ? "max-w-5xl" : "max-w-3xl"} bg-white/70 dark:bg-white/5 backdrop-blur-xl focus-within:bg-white/90 dark:focus-within:bg-white/8 rounded-2xl border border-white/60 dark:border-white/10 shadow-[0_4px_20px_rgba(61,57,41,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)] flex flex-col transition-all duration-300`}>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); }
                }}
                placeholder="回复 Agent（输入 @ 提及，/ 执行命令）"
                rows={3}
                className="w-full resize-none outline-none bg-transparent text-[#3d3929] dark:text-[#e8e3d8] placeholder-[#a8a294] dark:placeholder-[#6b6553] px-4 pt-4 pb-2 leading-relaxed"
                style={{ fontSize: 15 }}
              />
              <div className="flex items-center justify-between px-3 pb-3">
                <div className="flex items-center gap-1">
                  {/* Model selector */}
                  <div className="relative" ref={modelRef}>
                    <button
                      onClick={() => setModelOpen((o) => !o)}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg hover:bg-[#f0ece1] dark:hover:bg-white/8 transition-all active:scale-95 text-[#4d4a42] dark:text-[#c8c3b5] bg-transparent"
                      style={{ fontSize: 13 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[#cc6b3f]">
                        <path d="M12 2C12 2 12.8 8.2 14.8 10.2C16.8 12.2 22 12 22 12C22 12 16.8 11.8 14.8 13.8C12.8 15.8 12 22 12 22C12 22 11.2 15.8 9.2 13.8C7.2 11.8 2 12 2 12C2 12 7.2 12.2 9.2 10.2C11.2 8.2 12 2 12 2Z" />
                      </svg>
                      <span>Default</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#a8a294] dark:text-[#6b6553]" />
                    </button>

                    {modelOpen && (
                      <div className="claude-pop absolute bottom-full left-0 mb-2 w-72 rounded-2xl overflow-hidden" style={glassStyle(isDark)}>
                        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
                        <div className="py-2">
                          {models.map((m) => (
                            <button
                              key={m.name}
                              onClick={() => { setSelectedModel(m.name); setModelOpen(false); click(`已选择模型: ${m.name}`); }}
                              className="w-full flex items-start justify-between px-4 py-2 transition-all text-left bg-transparent"
                              style={{ background: "transparent" }}
                              {...hoverRow(isDark)}
                            >
                              <div>
                                <div className={`flex items-center gap-2 ${isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"}`} style={{ fontSize: 14 }}>{m.name}</div>
                                <div className={isDark ? "text-[#9a9485]" : "text-[#6b6553]"} style={{ fontSize: 12 }}>{m.desc}</div>
                              </div>
                              {m.upgrade ? (
                                <span className="px-2 py-0.5 rounded-md text-[#5b7fb5]" style={{ fontSize: 11, background: "rgba(91,127,181,0.12)", border: "1px solid rgba(91,127,181,0.2)" }}>
                                  Upgrade
                                </span>
                              ) : selectedModel === m.name ? (
                                <Check className="w-4 h-4 text-[#5b7fb5] mt-1" />
                              ) : null}
                            </button>
                          ))}
                          <div className="mx-3 my-1 h-px" style={{ background: isDark ? "linear-gradient(to right,transparent,rgba(255,255,255,0.10),transparent)" : "linear-gradient(to right,transparent,rgba(180,170,140,0.35),transparent)" }} />
                          <div className="px-4 py-2 flex items-center justify-between">
                            <div>
                              <div className={isDark ? "text-[#e8e3d8]" : ""} style={{ fontSize: 14 }}>Adaptive thinking</div>
                              <div className={isDark ? "text-[#9a9485]" : "text-[#6b6553]"} style={{ fontSize: 12 }}>Thinks for more complex tasks</div>
                            </div>
                            <button
                              onClick={() => { setAdaptive((a) => !a); click(`Adaptive thinking ${!adaptive ? "已开启" : "已关闭"}`); }}
                              className={`w-10 h-6 rounded-full transition-all relative ${adaptive ? "bg-[#5b7fb5]" : isDark ? "bg-white/20" : "bg-[#d9d5c7]"}`}
                              style={{ boxShadow: adaptive ? "0 0 0 3px rgba(91,127,181,0.18)" : "none" }}
                            >
                              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${adaptive ? "left-[18px]" : "left-0.5"}`} />
                            </button>
                          </div>
                          <div className="mx-3 my-1 h-px" style={{ background: isDark ? "linear-gradient(to right,transparent,rgba(255,255,255,0.10),transparent)" : "linear-gradient(to right,transparent,rgba(180,170,140,0.35),transparent)" }} />
                          <button
                            onClick={() => { click("查看更多模型"); setModelOpen(false); }}
                            className={`w-full flex items-center justify-between px-4 py-2 transition-all bg-transparent ${isDark ? "text-[#e8e3d8]" : ""}`}
                            style={{ fontSize: 14, background: "transparent" }}
                            {...hoverRow(isDark)}
                          >
                            More models
                            <ChevronRight className="w-4 h-4 text-[#a8a294] dark:text-[#6b6553]" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thinking depth */}
                  <div className="relative" ref={thinkDepthRef}>
                    <button
                      onClick={() => setThinkDepthOpen((o) => !o)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 bg-transparent ${
                        thinkingDepth === "关闭"
                          ? "text-[#a8a294] dark:text-[#6b6553] hover:bg-[#f0ece1] dark:hover:bg-white/8"
                          : "text-[#5b7fb5] hover:bg-[#eef1f8] dark:hover:bg-[#5b7fb5]/15"
                      }`}
                      style={{ fontSize: 13 }}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
                        <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
                      </svg>
                      <span>{thinkingDepth}</span>
                      <ChevronDown className="w-3 h-3 text-[#a8a294] dark:text-[#6b6553]" />
                    </button>

                    {thinkDepthOpen && (() => {
                      const levels: { value: "关闭"|"自动"|"低"|"中"|"高"; label: string; desc: string; bars: number }[] = [
                        { value: "关闭", label: "关闭", desc: "不使用思考步骤",     bars: 0  },
                        { value: "自动", label: "自动", desc: "根据任务自动调整",   bars: -1 },
                        { value: "低",   label: "低",   desc: "简单推理，响应更快", bars: 1  },
                        { value: "中",   label: "中",   desc: "均衡推理与速度",     bars: 2  },
                        { value: "高",   label: "高",   desc: "深度推理，更准确",   bars: 3  },
                      ];
                      return (
                        <div className="claude-pop absolute bottom-full left-0 mb-2 w-64 rounded-2xl overflow-hidden z-30" style={glassStyle(isDark)}>
                          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
                          <div className="px-3 pt-3 pb-1">
                            <div className={`px-1 mb-1.5 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} style={{ fontSize: 11, letterSpacing: "0.04em" }}>思考深度</div>
                          </div>
                          <div className="pb-2">
                            {levels.map((lvl) => {
                              const isActive = thinkingDepth === lvl.value;
                              return (
                                <button
                                  key={lvl.value}
                                  onClick={() => { setThinkingDepth(lvl.value); setThinkDepthOpen(false); toast(`思考深度: ${lvl.label}`); }}
                                  className="w-full flex items-center justify-between px-4 py-2 transition-all text-left bg-transparent"
                                  style={{ background: "transparent" }}
                                  {...hoverRow(isDark)}
                                >
                                  <div className="flex items-center gap-2.5">
                                    <div className="flex items-end gap-0.5 w-5 h-4 shrink-0">
                                      {lvl.bars === -1 ? (
                                        [0.6, 1, 0.7].map((h, i) => (
                                          <div key={i} className="flex-1 rounded-sm bg-[#5b7fb5] opacity-80" style={{ height: `${h * 100}%` }} />
                                        ))
                                      ) : lvl.bars === 0 ? (
                                        <div className={`w-full h-0.5 rounded-full self-center ${isDark ? "bg-white/20" : "bg-[#c8c3b5]"}`} />
                                      ) : (
                                        [1, 2, 3].map((b) => (
                                          <div key={b} className="flex-1 rounded-sm transition-all"
                                            style={{ height: `${(b / 3) * 100}%`, background: b <= lvl.bars ? "#5b7fb5" : isDark ? "rgba(255,255,255,0.12)" : "rgba(180,170,140,0.3)" }}
                                          />
                                        ))
                                      )}
                                    </div>
                                    <div>
                                      <div style={{ fontSize: 13 }} className={isActive ? (isDark ? "text-[#e8e3d8]" : "text-[#3d3929]") : (isDark ? "text-[#c8c3b5]" : "text-[#4d4a42]")}>{lvl.label}</div>
                                      <div className={isDark ? "text-[#6b6553]" : "text-[#a8a294]"} style={{ fontSize: 11 }}>{lvl.desc}</div>
                                    </div>
                                  </div>
                                  {isActive && <Check className="w-3.5 h-3.5 text-[#5b7fb5] shrink-0" />}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Attachment + send */}
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => toast("附件功能开发中")}
                    className="p-1.5 text-[#8b877a] dark:text-[#6b6553] hover:text-[#4d4a42] dark:hover:text-[#9a9485] hover:bg-[#f0ece1] dark:hover:bg-white/8 rounded-lg transition-all active:scale-95 bg-transparent"
                    title="Add attachment"
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                    </svg>
                  </button>
                  <button
                    onClick={send}
                    className="claude-send-pulse claude-btn flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#d6754f] to-[#b85535] hover:from-[#dc8059] hover:to-[#bf5a3a] text-white shadow-[0_4px_14px_rgba(201,100,66,0.32)]"
                  >
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
              {quickActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => click(`快捷操作: ${a.label}`)}
                  className="claude-btn flex items-center gap-2 px-4 py-2 rounded-full bg-white/70 dark:bg-white/5 backdrop-blur-md border border-white/60 dark:border-white/10 hover:bg-white/90 dark:hover:bg-white/10 hover:border-[#d9d5c7] dark:hover:border-white/20 hover:shadow-md text-[#3d3929] dark:text-[#e8e3d8]"
                  style={{ fontSize: 13 }}
                >
                  <a.icon className="w-4 h-4 text-[#6b6553] dark:text-[#9a9485]" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Right sidebar */}
      {activeRecent && (
        <RightSidebar
          open={rightOpen}
          width={rightWidth}
          onToggle={() => setRightOpen(o => !o)}
          onResizeStart={startRightResize}
          isDragging={isDragging === "right"}
          isDark={isDark}
        />
      )}

      <SettingsDialog open={settingsOpen} onClose={() => setSettingsOpen(false)} isDark={isDark} />
      <ContextDetailsDialog open={ctxOpen} onClose={() => setCtxOpen(false)} isDark={isDark} />

      {/* Search overlay */}
      {searchOpen && (
        <div
          className="fixed inset-0 bg-black/20 dark:bg-black/50 backdrop-blur-md flex items-start justify-center pt-24 z-50"
          onClick={() => setSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl backdrop-blur-xl rounded-2xl overflow-hidden"
            style={{
              background: isDark ? "rgba(28,26,22,0.97)" : "rgba(255,255,255,0.92)",
              border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,255,255,0.65)",
              boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.55)" : "0 20px 60px rgba(0,0,0,0.15)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e8e4d8] dark:border-white/10">
              <Search className="w-4 h-4 text-[#6b6553] dark:text-[#9a9485]" />
              <input
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索对话..."
                className="flex-1 outline-none bg-transparent text-[#3d3929] dark:text-[#e8e3d8] placeholder-[#a8a294] dark:placeholder-[#6b6553]"
                style={{ fontSize: 14 }}
              />
              <kbd className="px-1.5 py-0.5 rounded bg-[#f0ece0] dark:bg-white/10 text-[#6b6553] dark:text-[#9a9485]" style={{ fontSize: 11 }}>ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto py-2">
              {recents
                .filter((r) => r.toLowerCase().includes(searchQuery.toLowerCase()))
                .map((r) => (
                  <button
                    key={r}
                    onClick={() => { setActiveRecent(r); setSearchOpen(false); setSearchQuery(""); }}
                    className="w-full text-left px-4 py-2 hover:bg-[#f5f4ef] dark:hover:bg-white/8 transition truncate text-[#3d3929] dark:text-[#e8e3d8] bg-transparent"
                    style={{ fontSize: 14 }}
                  >
                    {r}
                  </button>
                ))}
              {recents.filter((r) => r.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                <div className="px-4 py-6 text-center text-[#a8a294] dark:text-[#6b6553]" style={{ fontSize: 13 }}>
                  无匹配结果
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}