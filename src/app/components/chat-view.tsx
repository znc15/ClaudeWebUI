import { useState, useRef, useEffect } from "react";
import {
  ChevronDown,
  ChevronRight,
  Terminal,
  Search,
  PenLine,
  FileText,
  Copy,
  Check,
  PanelRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

import type { ChatMessage, SessionDetail, SocketStatus, ToolBlock } from "../types";

interface ChatViewProps {
  connectionLabel: string;
  draft: string;
  isDark: boolean;
  onDraftChange: (value: string) => void;
  onSend: () => void;
  session: SessionDetail | null;
  socketReady: boolean;
  socketStatus: SocketStatus;
  wideMode?: boolean;
  onToggleRight?: () => void;
  rightOpen?: boolean;
}

const EDIT_ACTION_LABELS = {
  edit: "Edit",
  multiedit: "MultiEdit",
  read: "Read",
  write: "Write",
} as const;

function ThinkingBlock({
  block,
  isDark,
}: {
  block: Extract<ToolBlock, { kind: "thinking" }>;
  isDark: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 transition ${
          isDark
            ? "text-[#9a9485] hover:text-[#c8c3b5]"
            : "text-[#6b6553] hover:text-[#3d3929]"
        }`}
        style={{ fontSize: 13 }}
      >
        {open ? (
          <ChevronDown className="w-3.5 h-3.5" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5" />
        )}
        <Sparkles className="w-3.5 h-3.5" />
        Thinking
        <span className={isDark ? "text-[#6b6553]" : "text-[#a8a294]"}>
          · {block.steps} steps
        </span>
      </button>
      {open && (
        <div
          className={`mt-2 ml-5 pl-3 border-l-2 ${
            isDark ? "border-white/10" : "border-[#e8e4d8]"
          } space-y-2`}
        >
          {block.content.map((c, i) => (
            <p
              key={i}
              className={isDark ? "text-[#9a9485]" : "text-[#6b6553]"}
              style={{ fontSize: 13, lineHeight: 1.6 }}
            >
              {c}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolPill({
  icon: Icon,
  label,
  onClick,
  isDark,
}: {
  icon: typeof Terminal;
  label: string;
  onClick?: () => void;
  isDark: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md transition active:scale-95 ${
        isDark ? "bg-white/10 hover:bg-white/15" : "bg-[#f0ece0] hover:bg-[#e8e4d8]"
      }`}
      style={{ fontSize: 12 }}
    >
      <Icon className={`w-3 h-3 ${isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`} />
      <span className={isDark ? "text-[#c8c3b5]" : "text-[#3d3929]"}>{label}</span>
    </button>
  );
}

function CodeBlock({
  code,
  lang = "bash",
  isDark,
}: {
  code: string;
  lang?: string;
  isDark: boolean;
}) {
  const [copied, setCopied] = useState(false);
  return (
    <div
      className={`my-2 rounded-lg overflow-hidden border ${
        isDark ? "border-white/10" : "border-[#e8e4d8]"
      }`}
    >
      <div
        className={`flex items-center justify-between px-3 py-1.5 border-b ${
          isDark
            ? "bg-white/8 border-white/10"
            : "bg-[#f0ece0] border-[#e8e4d8]"
        }`}
      >
        <span
          className={`${isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`}
          style={{ fontSize: 11 }}
        >
          {lang.toUpperCase()}
        </span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            toast.success("已复制");
            setTimeout(() => setCopied(false), 1500);
          }}
          className={`transition ${
            isDark
              ? "text-[#9a9485] hover:text-[#c8c3b5]"
              : "text-[#6b6553] hover:text-[#3d3929]"
          }`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre
        className={`px-3 py-2 overflow-x-auto ${
          isDark ? "bg-[#1a1917]" : "bg-white"
        }`}
        style={{ fontSize: 12, fontFamily: "ui-monospace, monospace" }}
      >
        <code className={isDark ? "text-[#c8c3b5]" : ""}>{code}</code>
      </pre>
    </div>
  );
}

export function ChatView({
  connectionLabel,
  draft,
  isDark,
  onDraftChange,
  onSend,
  session,
  socketReady,
  socketStatus,
  wideMode = false,
  onToggleRight,
  rightOpen = true,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [modelOpen, setModelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Sonnet 4.6");
  const [adaptive, setAdaptive] = useState(true);
  const [thinkingDepth, setThinkingDepth] = useState<"关闭" | "自动" | "低" | "中" | "高">("自动");
  const [thinkDepthOpen, setThinkDepthOpen] = useState(false);

  const modelRef = useRef<HTMLDivElement>(null);
  const thinkDepthRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session?.messages]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node))
        setModelOpen(false);
      if (thinkDepthRef.current && !thinkDepthRef.current.contains(e.target as Node))
        setThinkDepthOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const D = isDark;
  const glassStyle = {
    background: D
      ? "linear-gradient(145deg, rgba(40,37,30,0.97) 0%, rgba(28,26,22,0.95) 100%)"
      : "linear-gradient(145deg, rgba(255,255,255,0.82) 0%, rgba(245,243,235,0.78) 100%)",
    backdropFilter: "blur(28px) saturate(180%)",
    WebkitBackdropFilter: "blur(28px) saturate(180%)",
    border: D
      ? "1px solid rgba(255,255,255,0.10)"
      : "1px solid rgba(255,255,255,0.72)",
    boxShadow: D
      ? "0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)"
      : "0 8px 32px rgba(61,57,41,0.13), 0 2px 8px rgba(61,57,41,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
  } as React.CSSProperties;

  const hoverRow = {
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.background = D
        ? "rgba(255,255,255,0.07)"
        : "rgba(255,255,255,0.55)";
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.background = "transparent";
    },
  };

  const models = [
    { name: "Opus 4.7", desc: "Most capable for ambitious work", upgrade: true },
    { name: "Sonnet 4.6", desc: "Most efficient for everyday tasks" },
    { name: "Haiku 4.5", desc: "Fastest for quick answers" },
  ];

  const thinkingModes = [
    { value: "关闭", label: "关闭", desc: "不使用思考步骤", bars: 0 },
    { value: "自动", label: "自动", desc: "根据任务自动调整", bars: -1 },
    { value: "低", label: "低", desc: "简单推理，响应更快", bars: 1 },
    { value: "中", label: "中", desc: "均衡推理与速度", bars: 2 },
    { value: "高", label: "高", desc: "深度推理，更准确", bars: 3 },
  ];

  if (!session) {
    return (
      <div className="flex flex-1 items-center justify-center px-6 py-10">
        <div
          className={`max-w-xl rounded-[2rem] border px-8 py-10 text-center ${
            isDark
              ? "border-white/10 bg-white/5 text-[#e9dfd1]"
              : "border-black/8 bg-white/80 text-[#352f24]"
          }`}
        >
          <Sparkles className="mx-auto mb-4 size-8 text-[#cc6b3f]" />
          <h2 className="font-serif text-3xl">准备连接 Claude 会话</h2>
          <p className="mt-3 text-sm leading-7 text-[#827664] dark:text-[#aa9f91]">
            左侧先创建或选择一个会话。连接成功后，这里会实时展示 Claude CLI
            的回复、工具调用和退出状态。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div
        className={`flex items-center justify-between px-6 py-3 border-b ${
          isDark ? "border-white/10" : "border-[#e8e4d8]"
        }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <h2
            className={`truncate ${isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"}`}
            style={{ fontFamily: "Georgia, serif", fontSize: 18 }}
          >
            {session.title}
          </h2>
          <span className="rounded-full bg-[#cc6b3f]/12 px-3 py-1 text-sm text-[#a4502d] dark:text-[#f0c2aa]">
            {session.status}
          </span>
          {session.exitCode !== null && (
            <span className="rounded-full bg-[#dfd5ca] px-3 py-1 text-sm text-[#665a48] dark:bg-[#342f29] dark:text-[#d9d0c4]">
              exit {session.exitCode}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <p className="text-xs text-[#827664] dark:text-[#aa9f91] mr-2">
            {connectionLabel} · {socketStatus.detail}
          </p>
          {onToggleRight && (
            <button
              onClick={onToggleRight}
              className={`p-2 rounded-md transition active:scale-95 bg-transparent ${
                isDark ? "hover:bg-white/8" : "hover:bg-[#ebe7d9]"
              }`}
              title={rightOpen ? "隐藏右侧面板" : "显示右侧面板"}
            >
              <PanelRight
                className={`w-4 h-4 ${
                  rightOpen
                    ? "text-[#cc6b3f]"
                    : isDark
                    ? "text-[#9a9485]"
                    : "text-[#6b6553]"
                }`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
        <div
          className={`${wideMode ? "max-w-5xl" : "max-w-3xl"} mx-auto space-y-10 transition-all duration-300`}
        >
          {session.messages.map((message) => (
            <MessageCard key={message.id} isDark={isDark} message={message} />
          ))}
        </div>
      </div>

      {/* Footer input */}
      <div className="px-6 pb-6">
        <div
          className={`claude-input-glow ${wideMode ? "max-w-5xl" : "max-w-3xl"} mx-auto rounded-2xl border flex flex-col transition-all duration-300 ${
            isDark
              ? "bg-white/5 border-white/10 focus-within:bg-white/8"
              : "bg-[#fdfdfc] border-[#e8e4d8] focus-within:bg-white shadow-sm"
          }`}
        >
          <textarea
            placeholder="回复 Agent（输入 @ 提及，/ 执行命令）"
            rows={3}
            className={`w-full resize-none outline-none bg-transparent placeholder-[#a8a294] dark:placeholder-[#6b6553] px-4 pt-4 pb-2 leading-relaxed ${
              isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"
            }`}
            style={{ fontSize: 15 }}
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                onSend();
              }
            }}
            disabled={!socketReady || session.status === "exited"}
          />
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">
              {/* Model selector */}
              <div className="relative" ref={modelRef}>
                <button
                  onClick={() => setModelOpen((o) => !o)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 bg-transparent ${
                    isDark
                      ? "text-[#c8c3b5] hover:bg-white/8"
                      : "text-[#4d4a42] hover:bg-[#f0ece1]"
                  }`}
                  style={{ fontSize: 13 }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className="text-[#cc6b3f]"
                  >
                    <path d="M12 2C12 2 12.8 8.2 14.8 10.2C16.8 12.2 22 12 22 12C22 12 16.8 11.8 14.8 13.8C12.8 15.8 12 22 12 22C12 22 11.2 15.8 9.2 13.8C7.2 11.8 2 12 2 12C2 12 7.2 12.2 9.2 10.2C11.2 8.2 12 2 12 2Z" />
                  </svg>
                  <span>{selectedModel}</span>
                  <ChevronDown
                    className={`w-3.5 h-3.5 ${
                      isDark ? "text-[#6b6553]" : "text-[#a8a294]"
                    }`}
                  />
                </button>

                {modelOpen && (
                  <div
                    className="claude-pop absolute bottom-full left-0 mb-2 w-72 rounded-2xl overflow-hidden z-30"
                    style={glassStyle}
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
                    <div className="py-2">
                      {models.map((m) => (
                        <button
                          key={m.name}
                          onClick={() => {
                            setSelectedModel(m.name);
                            setModelOpen(false);
                            toast(`已选择模型: ${m.name}`);
                          }}
                          className="w-full flex items-start justify-between px-4 py-2 transition-all text-left bg-transparent"
                          style={{ background: "transparent" }}
                          {...hoverRow}
                        >
                          <div>
                            <div
                              className={isDark ? "text-[#e8e3d8]" : ""}
                              style={{ fontSize: 14 }}
                            >
                              {m.name}
                            </div>
                            <div
                              className={
                                isDark ? "text-[#9a9485]" : "text-[#6b6553]"
                              }
                              style={{ fontSize: 12 }}
                            >
                              {m.desc}
                            </div>
                          </div>
                          {m.upgrade ? (
                            <span
                              className="px-2 py-0.5 rounded-md text-[#5b7fb5]"
                              style={{
                                fontSize: 11,
                                background: "rgba(91,127,181,0.12)",
                                border: "1px solid rgba(91,127,181,0.2)",
                              }}
                            >
                              Upgrade
                            </span>
                          ) : selectedModel === m.name ? (
                            <Check className="w-4 h-4 text-[#5b7fb5] mt-1" />
                          ) : null}
                        </button>
                      ))}
                      <div
                        className="mx-3 my-1 h-px"
                        style={{
                          background: isDark
                            ? "linear-gradient(to right,transparent,rgba(255,255,255,0.10),transparent)"
                            : "linear-gradient(to right,transparent,rgba(180,170,140,0.35),transparent)",
                        }}
                      />
                      <div className="px-4 py-2 flex items-center justify-between">
                        <div>
                          <div
                            className={isDark ? "text-[#e8e3d8]" : ""}
                            style={{ fontSize: 14 }}
                          >
                            Adaptive thinking
                          </div>
                          <div
                            className={
                              isDark ? "text-[#9a9485]" : "text-[#6b6553]"
                            }
                            style={{ fontSize: 12 }}
                          >
                            Thinks for more complex tasks
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setAdaptive((a) => !a);
                            toast(
                              `Adaptive thinking ${!adaptive ? "已开启" : "已关闭"}`
                            );
                          }}
                          className={`w-10 h-6 rounded-full transition-all relative ${
                            adaptive
                              ? "bg-[#5b7fb5]"
                              : isDark
                              ? "bg-white/20"
                              : "bg-[#d9d5c7]"
                          }`}
                          style={{
                            boxShadow: adaptive
                              ? "0 0 0 3px rgba(91,127,181,0.18)"
                              : "none",
                          }}
                        >
                          <span
                            className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${
                              adaptive ? "left-[18px]" : "left-0.5"
                            }`}
                          />
                        </button>
                      </div>
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
                      ? isDark
                        ? "text-[#6b6553] hover:bg-white/8"
                        : "text-[#a8a294] hover:bg-[#f0ece1]"
                      : isDark
                      ? "text-[#5b7fb5] hover:bg-[#5b7fb5]/15"
                      : "text-[#5b7fb5] hover:bg-[#eef1f8]"
                  }`}
                  style={{ fontSize: 13 }}
                >
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z" />
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z" />
                  </svg>
                  <span>{thinkingDepth}</span>
                  <ChevronDown
                    className={`w-3 h-3 ${
                      isDark ? "text-[#6b6553]" : "text-[#a8a294]"
                    }`}
                  />
                </button>

                {thinkDepthOpen && (
                  <div
                    className="claude-pop absolute bottom-full left-0 mb-2 w-64 rounded-2xl overflow-hidden z-30"
                    style={glassStyle}
                  >
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
                    <div className="px-3 pt-3 pb-1">
                      <div
                        className={`px-1 mb-1.5 ${
                          isDark ? "text-[#6b6553]" : "text-[#a8a294]"
                        }`}
                        style={{ fontSize: 11, letterSpacing: "0.04em" }}
                      >
                        思考深度
                      </div>
                    </div>
                    <div className="pb-2">
                      {thinkingModes.map((lvl) => {
                        const isActive = thinkingDepth === lvl.value;
                        return (
                          <button
                            key={lvl.value}
                            onClick={() => {
                              setThinkingDepth(
                                lvl.value as "关闭" | "自动" | "低" | "中" | "高"
                              );
                              toast(`思考深度已设为: ${lvl.label}`);
                              setThinkDepthOpen(false);
                            }}
                            className="w-full flex items-center justify-between px-4 py-2 transition-all text-left bg-transparent"
                            style={{ background: "transparent" }}
                            {...hoverRow}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="flex items-end gap-0.5 w-5 h-4 shrink-0">
                                {lvl.bars === -1 ? (
                                  [0.6, 1, 0.7].map((h, i) => (
                                    <div
                                      key={i}
                                      className="flex-1 rounded-sm bg-[#5b7fb5] opacity-80"
                                      style={{ height: `${h * 100}%` }}
                                    />
                                  ))
                                ) : lvl.bars === 0 ? (
                                  <div
                                    className={`w-full h-0.5 rounded-full self-center ${
                                      isDark ? "bg-white/20" : "bg-[#c8c3b5]"
                                    }`}
                                  />
                                ) : (
                                  [1, 2, 3].map((b) => (
                                    <div
                                      key={b}
                                      className="flex-1 rounded-sm transition-all"
                                      style={{
                                        height: `${(b / 3) * 100}%`,
                                        background:
                                          b <= lvl.bars
                                            ? "#5b7fb5"
                                            : isDark
                                            ? "rgba(255,255,255,0.12)"
                                            : "rgba(180,170,140,0.3)",
                                      }}
                                    />
                                  ))
                                )}
                              </div>
                              <div>
                                <div
                                  style={{ fontSize: 13 }}
                                  className={
                                    isActive
                                      ? isDark
                                        ? "text-[#e8e3d8]"
                                        : "text-[#3d3929]"
                                      : isDark
                                      ? "text-[#c8c3b5]"
                                      : "text-[#4d4a42]"
                                  }
                                >
                                  {lvl.label}
                                </div>
                                <div
                                  className={
                                    isDark ? "text-[#6b6553]" : "text-[#a8a294]"
                                  }
                                  style={{ fontSize: 11 }}
                                >
                                  {lvl.desc}
                                </div>
                              </div>
                            </div>
                            {isActive && (
                              <Check className="w-3.5 h-3.5 text-[#5b7fb5] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Attachment + send */}
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => toast("附件功能开发中")}
                className={`p-1.5 rounded-lg transition-all active:scale-95 bg-transparent ${
                  isDark
                    ? "text-[#6b6553] hover:text-[#9a9485] hover:bg-white/8"
                    : "text-[#8b877a] hover:text-[#4d4a42] hover:bg-[#f0ece1]"
                }`}
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48" />
                </svg>
              </button>
              <button
                onClick={onSend}
                disabled={!socketReady || !draft.trim() || session.status === "exited"}
                className="claude-btn claude-send-pulse flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#d6754f] to-[#b85535] hover:from-[#dc8059] hover:to-[#bf5a3a] text-white shadow-[0_4px_14px_rgba(201,100,66,0.32)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 2L11 13" />
                  <path d="M22 2L15 22L11 13L2 9L22 2Z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageCard({
  isDark,
  message,
}: {
  isDark: boolean;
  message: ChatMessage;
}) {
  const fromUser = message.role === "user";
  const container = fromUser ? "ml-auto max-w-3xl" : "mr-auto max-w-4xl";
  const bubble = fromUser
    ? "bg-[#efe5d7] text-[#332d22] dark:bg-[#3b3229] dark:text-[#f3e8db]"
    : isDark
    ? "bg-white/6 text-[#efe6da]"
    : "bg-white text-[#342d22]";

  return (
    <div className={`space-y-3 ${container}`}>
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-[#8c806f] dark:text-[#9e9284]">
        {fromUser ? (
          <span className="w-3.5 h-3.5 flex items-center justify-center rounded-full bg-[#cc6b3f]/20 text-[#cc6b3f]">
            U
          </span>
        ) : (
          <svg
            viewBox="0 0 24 24"
            className="w-3.5 h-3.5 text-[#cc6b3f]"
            fill="currentColor"
          >
            <path
              d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
          </svg>
        )}
        {message.role}
      </div>
      <div
        className={`rounded-[1.75rem] border border-black/8 p-4 shadow-sm dark:border-white/10 ${bubble}`}
      >
        <p className="whitespace-pre-wrap text-sm leading-7">
          {message.content || "Claude 正在输出..."}
        </p>
        <div className="mt-4 space-y-3">
          {message.blocks.map((block, index) => (
            <ToolBlockView
              key={`${message.id}-${index}`}
              block={block}
              isDark={isDark}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function ToolBlockView({
  block,
  isDark,
}: {
  block: ToolBlock;
  isDark: boolean;
}) {
  const panel = isDark
    ? "border-white/10 bg-[#1a1a1a] text-[#e7ddd0]"
    : "border-black/8 bg-[#faf7f1] text-[#3c3428]";

  if (block.kind === "text") {
    return null;
  }

  if (block.kind === "thinking") {
    return (
      <section className={`rounded-2xl border p-3 ${panel}`}>
        <ThinkingBlock block={block} isDark={isDark} />
      </section>
    );
  }

  if (block.kind === "agent") {
    return (
      <section className={`rounded-2xl border p-3 ${panel}`}>
        <div className="flex items-center justify-between gap-3 text-sm font-medium">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            <span>{block.toolName}</span>
          </div>
          <span className="text-xs text-[#8c806f] dark:text-[#9e9284]">
            {block.agent}
          </span>
        </div>
        <p className="mt-2 text-sm text-[#7c6f5f] dark:text-[#b5a89a]">
          状态: {block.status || "unknown"}
        </p>
        {block.details.length > 0 ? (
          <div className="mt-2 space-y-2 text-sm leading-6 text-[#7c6f5f] dark:text-[#b5a89a]">
            {block.details.map((detail, index) => (
              <p key={`${block.agent}-${index}`}>{detail}</p>
            ))}
          </div>
        ) : null}
      </section>
    );
  }

  if (block.kind === "bash") {
    return (
      <section className={`rounded-xl border overflow-hidden ${panel}`}>
        <div
          className={`flex items-center justify-between px-3.5 py-2 border-b ${
            isDark
              ? "bg-white/5 border-white/8"
              : "bg-[#f5f4ef] border-[#e8e4d8]"
          }`}
        >
          <ToolPill
            icon={Terminal}
            label="Bash"
            onClick={() => toast("查看 bash 详情")}
            isDark={isDark}
          />
          <span className="flex items-center gap-1 text-green-500" style={{ fontSize: 11 }}>
            <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3">
              <path
                d="M10 3L5 8.5 2 5.5"
                stroke="currentColor"
                strokeWidth="1.5"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            已完成
          </span>
        </div>
        <div
          className={`px-4 py-3 ${
            isDark
              ? "bg-black/20 text-[#c8c3b5]"
              : "bg-[#fdfdfc] text-[#3d3929]"
          }`}
          style={{
            fontSize: 12,
            fontFamily: "ui-monospace, monospace",
            lineHeight: 1.6,
          }}
        >
          <span className={isDark ? "text-[#9a9485]" : "text-[#a8a294]"}>$ </span>
          {block.cmd}
        </div>
        {block.output && <CodeBlock code={block.output} lang="output" isDark={isDark} />}
      </section>
    );
  }

  if (block.kind === "grep") {
    return (
      <section className={`rounded-xl border overflow-hidden ${panel}`}>
        <div
          className={`flex items-center gap-2 px-3.5 py-2 border-b ${
            isDark
              ? "bg-white/5 border-white/8"
              : "bg-[#f5f4ef] border-[#e8e4d8]"
          }`}
        >
          <ToolPill
            icon={Search}
            label="Grep"
            onClick={() => toast("查看搜索结果")}
            isDark={isDark}
          />
          <span
            className={isDark ? "text-[#9a9485]" : "text-[#6b6553]"}
            style={{ fontSize: 12 }}
          >
            pattern:
          </span>
          <code
            className="text-[#cc6b3f] px-1 py-0.5 rounded"
            style={{
              fontSize: 12,
              background: isDark
                ? "rgba(204,107,63,0.12)"
                : "rgba(204,107,63,0.08)",
            }}
          >
            {block.pattern}
          </code>
          <span
            className={`ml-auto ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`}
            style={{ fontSize: 11 }}
          >
            {block.files.length} 个文件匹配
          </span>
        </div>
        <div className="px-3 py-2 space-y-0.5">
          {block.files.map((f) => (
            <button
              key={f}
              onClick={() => toast(`打开 ${f}`)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition bg-transparent ${
                isDark ? "hover:bg-white/8" : "hover:bg-[#f0ece0]"
              }`}
              style={{ fontSize: 12, fontFamily: "ui-monospace, monospace" }}
            >
              <FileText
                className={`w-3 h-3 shrink-0 ${
                  isDark ? "text-[#6b6553]" : "text-[#a8a294]"
                }`}
              />
              <span className="text-[#5b7fb5] truncate">{f}</span>
            </button>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className={`rounded-2xl border p-3 ${panel}`}>
      <div className="flex items-center justify-between gap-3 text-sm font-medium">
        <div className="flex items-center gap-2">
          <PenLine className="w-4 h-4" />
          <span>{EDIT_ACTION_LABELS[block.action]}</span>
        </div>
        <span className="text-xs text-[#8c806f] dark:text-[#9e9284]">
          {block.file}
        </span>
      </div>
      <p className="mt-2 text-sm text-[#7c6f5f] dark:text-[#b5a89a]">
        文件: {block.file}
      </p>
      {block.excerpt ? (
        <CodeBlock code={block.excerpt} lang="excerpt" isDark={isDark} />
      ) : null}
      {block.before ? (
        <CodeBlock code={block.before} lang="before" isDark={isDark} />
      ) : null}
      {block.after ? (
        <CodeBlock code={block.after} lang="after" isDark={isDark} />
      ) : null}
    </section>
  );
}