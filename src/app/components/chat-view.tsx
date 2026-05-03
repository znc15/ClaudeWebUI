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
  RefreshCw,
  PanelRight,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

type ToolBlock =
  | { kind: "thinking"; steps: number; content: string[] }
  | { kind: "bash"; cmd: string; output: string }
  | { kind: "grep"; pattern: string; files: string[] }
  | { kind: "edit"; file: string; before: string; after: string }
  | { kind: "text"; content: string };

export type Message = {
  role: "user" | "assistant";
  content: string;
  blocks?: ToolBlock[];
};

const sampleMessages: Message[] = [
  {
    role: "user",
    content: "帮我删除 Figma MCP 配置，仅保留我所有可用的配置项",
  },
  {
    role: "assistant",
    content: "",
    blocks: [
      {
        kind: "thinking",
        steps: 2,
        content: [
          "用户要求删除 Figma MCP 相关配置。需要先定位 MCP 配置文件，理解结构后再做精确移除。",
          "我会用 Grep 搜索关键字 figma，定位涉及到的配置块再进行编辑。",
        ],
      },
      {
        kind: "bash",
        cmd: "openCode_bash 中查找配置 Figma MCP 配置项，以判断包含哪些可删除的配置块",
        output: "",
      },
      {
        kind: "grep",
        pattern: "figma",
        files: [
          "C:\\Users\\YangXiaoMian\\.claude.json",
          "C:\\Users\\YangXiaoMian\\.opencode\\opencode.json",
        ],
      },
      {
        kind: "text",
        content: "找到了 Figma MCP 配置，位于：",
      },
      {
        kind: "edit",
        file: "C:\\Users\\YangXiaoMian\\.claude.json",
        before: '"figma": { "command": "npx", "args": ["-y", "figma-mcp"] }',
        after: "// removed",
      },
      {
        kind: "text",
        content: "Figma MCP 配置已从以上两个配置文件中删除。",
      },
    ],
  },
];

function ThinkingBlock({ block, isDark }: { block: Extract<ToolBlock, { kind: "thinking" }>; isDark: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="my-2">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 transition ${isDark ? "text-[#9a9485] hover:text-[#c8c3b5]" : "text-[#6b6553] hover:text-[#3d3929]"}`}
        style={{ fontSize: 13 }}
      >
        {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        <Sparkles className="w-3.5 h-3.5" />
        Thinking
        <span className={isDark ? "text-[#6b6553]" : "text-[#a8a294]"}>· {block.steps} steps</span>
      </button>
      {open && (
        <div className={`mt-2 ml-5 pl-3 border-l-2 ${isDark ? "border-white/10" : "border-[#e8e4d8]"} space-y-2`}>
          {block.content.map((c, i) => (
            <p key={i} className={isDark ? "text-[#9a9485]" : "text-[#6b6553]"} style={{ fontSize: 13, lineHeight: 1.6 }}>
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
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md transition active:scale-95 ${isDark ? "bg-white/10 hover:bg-white/15" : "bg-[#f0ece0] hover:bg-[#e8e4d8]"}`}
      style={{ fontSize: 12 }}
    >
      <Icon className={`w-3 h-3 ${isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`} />
      <span className={isDark ? "text-[#c8c3b5]" : "text-[#3d3929]"}>{label}</span>
    </button>
  );
}

function CodeBlock({ code, lang = "bash", isDark }: { code: string; lang?: string; isDark: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className={`my-2 rounded-lg overflow-hidden border ${isDark ? "border-white/10" : "border-[#e8e4d8]"}`}>
      <div className={`flex items-center justify-between px-3 py-1.5 border-b ${isDark ? "bg-white/8 border-white/10" : "bg-[#f0ece0] border-[#e8e4d8]"}`}>
        <span className={`${isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`} style={{ fontSize: 11 }}>{lang.toUpperCase()}</span>
        <button
          onClick={() => {
            navigator.clipboard?.writeText(code);
            setCopied(true);
            toast.success("已复制");
            setTimeout(() => setCopied(false), 1500);
          }}
          className={`transition ${isDark ? "text-[#9a9485] hover:text-[#c8c3b5]" : "text-[#6b6553] hover:text-[#3d3929]"}`}
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
        </button>
      </div>
      <pre className={`px-3 py-2 overflow-x-auto ${isDark ? "bg-[#1a1917]" : "bg-white"}`} style={{ fontSize: 12, fontFamily: "ui-monospace, monospace" }}>
        <code className={isDark ? "text-[#c8c3b5]" : ""}>{code}</code>
      </pre>
    </div>
  );
}

export function ChatView({
  title,
  onBranch,
  wideMode = false,
  isDark = false,
  onToggleRight,
  rightOpen = true,
}: {
  title: string;
  onBranch?: (msg: string) => void;
  wideMode?: boolean;
  isDark?: boolean;
  onToggleRight?: () => void;
  rightOpen?: boolean;
}) {
  const [starred, setStarred] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState("自动");
  const [modelOpen, setModelOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState("Sonnet 4.6");
  const [adaptive, setAdaptive] = useState(true);

  const modelRef = useRef<HTMLDivElement>(null);
  const modeRef  = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (modelRef.current && !modelRef.current.contains(e.target as Node)) setModelOpen(false);
      if (modeRef.current  && !modeRef.current.contains(e.target as Node))  setModeOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const thinkingModes = [
    { label: "关闭", desc: "不使用扩展思考，直接回复",     icon: "○"   },
    { label: "自动", desc: "Claude 根据问题复杂度自动判断", icon: "◐"   },
    { label: "低",   desc: "适合简单推理，速度优先",        icon: "●"   },
    { label: "中",   desc: "均衡推理质量与响应速度",        icon: "●●"  },
    { label: "高",   desc: "深度思考，适合复杂分析",        icon: "●●●" },
  ];

  const models = [
    { name: "Opus 4.7",   desc: "Most capable for ambitious work",    upgrade: true },
    { name: "Sonnet 4.6", desc: "Most efficient for everyday tasks" },
    { name: "Haiku 4.5",  desc: "Fastest for quick answers" },
  ];

  const glassStyle = {
    background: isDark
      ? "linear-gradient(145deg, rgba(40,37,30,0.97) 0%, rgba(28,26,22,0.95) 100%)"
      : "linear-gradient(145deg, rgba(255,255,255,0.82) 0%, rgba(245,243,235,0.78) 100%)",
    backdropFilter: "blur(28px) saturate(180%)",
    WebkitBackdropFilter: "blur(28px) saturate(180%)",
    border: isDark ? "1px solid rgba(255,255,255,0.10)" : "1px solid rgba(255,255,255,0.72)",
    boxShadow: isDark
      ? "0 8px 32px rgba(0,0,0,0.55), 0 2px 8px rgba(0,0,0,0.35)"
      : "0 8px 32px rgba(61,57,41,0.13), 0 2px 8px rgba(61,57,41,0.07), inset 0 1px 0 rgba(255,255,255,0.9)",
  } as React.CSSProperties;

  const hoverRow = {
    onMouseEnter: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.55)";
    },
    onMouseLeave: (e: React.MouseEvent<HTMLButtonElement>) => {
      e.currentTarget.style.background = "transparent";
    },
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <div className={`flex items-center justify-between px-6 py-3 border-b ${isDark ? "border-white/10" : "border-[#e8e4d8]"}`}>
        <div className="flex items-center gap-2 min-w-0">
          <h2 className={`truncate ${isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"}`} style={{ fontFamily: "Georgia, serif", fontSize: 18 }}>
            {title}
          </h2>
        </div>
        <div className="flex items-center gap-1">
          {onToggleRight && (
            <button
              onClick={onToggleRight}
              className={`p-2 rounded-md transition active:scale-95 bg-transparent ${isDark ? "hover:bg-white/8" : "hover:bg-[#ebe7d9]"}`}
              title={rightOpen ? "隐藏右侧面板" : "显示右侧面板"}
            >
              <PanelRight className={`w-4 h-4 ${rightOpen ? "text-[#cc6b3f]" : isDark ? "text-[#9a9485]" : "text-[#6b6553]"}`} />
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className={`${wideMode ? "max-w-5xl" : "max-w-3xl"} mx-auto space-y-10 transition-all duration-300`}>
          {sampleMessages.map((m, i) => (
            <div key={i}>
              {m.role === "user" ? (
                /* ── User bubble ── */
                <div className="flex flex-col items-end gap-1.5">
                  <span className={`px-1 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} style={{ fontSize: 11 }}>
                    You
                  </span>
                  <div
                    className={`max-w-[80%] rounded-2xl px-5 py-3.5 shadow-sm ${
                      isDark
                        ? "bg-white/10 text-[#e8e3d8]"
                        : "bg-[#f0ece0] text-[#3d3929]"
                    }`}
                    style={{ fontSize: 14, lineHeight: 1.75 }}
                  >
                    {m.content}
                  </div>
                </div>
              ) : (
                /* ── Assistant response ── */
                <div className="space-y-4">

                  {/* Claude avatar + name */}
                  <div className="flex items-center gap-2.5">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                      isDark ? "bg-[#cc6b3f]/20" : "bg-[#cc6b3f]/12"
                    }`}>
                      <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 text-[#cc6b3f]" fill="currentColor">
                        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93L4.93 19.07"
                          stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
                      </svg>
                    </div>
                    <span className={`${isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"}`} style={{ fontSize: 13 }}>
                      Claude
                    </span>
                    <span className={`${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} style={{ fontSize: 11 }}>
                      · 刚刚
                    </span>
                  </div>

                  {/* Blocks */}
                  <div className="space-y-3 pl-[2.375rem]">
                    {m.blocks?.map((b, j) => {

                      /* Thinking */
                      if (b.kind === "thinking")
                        return (
                          <div key={j} className={`rounded-xl border px-4 py-3 ${
                            isDark ? "border-white/8 bg-white/3" : "border-[#e8e4d8] bg-[#faf9f4]"
                          }`}>
                            <ThinkingBlock block={b} isDark={isDark} />
                          </div>
                        );

                      /* Plain text */
                      if (b.kind === "text")
                        return (
                          <p
                            key={j}
                            className={isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"}
                            style={{ fontSize: 14, lineHeight: 1.85 }}
                          >
                            {b.content}
                          </p>
                        );

                      /* Bash */
                      if (b.kind === "bash")
                        return (
                          <div
                            key={j}
                            className={`rounded-xl border overflow-hidden ${
                              isDark ? "border-white/10" : "border-[#e8e4d8]"
                            }`}
                          >
                            {/* Header */}
                            <div className={`flex items-center justify-between px-3.5 py-2 border-b ${
                              isDark ? "bg-white/5 border-white/8" : "bg-[#f5f4ef] border-[#e8e4d8]"
                            }`}>
                              <div className="flex items-center gap-2">
                                <ToolPill icon={Terminal} label="Bash" onClick={() => toast("查看 bash 详情")} isDark={isDark} />
                                <span className={isDark ? "text-[#6b6553]" : "text-[#a8a294]"} style={{ fontSize: 11 }}>
                                  shell · 单次执行
                                </span>
                              </div>
                              <span className="flex items-center gap-1 text-green-500" style={{ fontSize: 11 }}>
                                <svg viewBox="0 0 12 12" fill="currentColor" className="w-3 h-3">
                                  <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                                已完成
                              </span>
                            </div>
                            {/* Command */}
                            <div
                              className={`px-4 py-3 ${isDark ? "bg-black/20 text-[#c8c3b5]" : "bg-[#fdfdfc] text-[#3d3929]"}`}
                              style={{ fontSize: 12, fontFamily: "ui-monospace, monospace", lineHeight: 1.6 }}
                            >
                              <span className={isDark ? "text-[#9a9485]" : "text-[#a8a294]"}>$ </span>
                              {b.cmd}
                            </div>
                          </div>
                        );

                      /* Grep */
                      if (b.kind === "grep")
                        return (
                          <div
                            key={j}
                            className={`rounded-xl border overflow-hidden ${
                              isDark ? "border-white/10" : "border-[#e8e4d8]"
                            }`}
                          >
                            {/* Header */}
                            <div className={`flex items-center gap-2 px-3.5 py-2 border-b ${
                              isDark ? "bg-white/5 border-white/8" : "bg-[#f5f4ef] border-[#e8e4d8]"
                            }`}>
                              <ToolPill icon={Search} label="Grep" onClick={() => toast("查看搜索结果")} isDark={isDark} />
                              <span className={isDark ? "text-[#9a9485]" : "text-[#6b6553]"} style={{ fontSize: 12 }}>
                                pattern:
                              </span>
                              <code className="text-[#cc6b3f] px-1 py-0.5 rounded" style={{
                                fontSize: 12,
                                background: isDark ? "rgba(204,107,63,0.12)" : "rgba(204,107,63,0.08)",
                              }}>
                                {b.pattern}
                              </code>
                              <span className={`ml-auto ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} style={{ fontSize: 11 }}>
                                {b.files.length} 个文件匹配
                              </span>
                            </div>
                            {/* Files */}
                            <div className="px-3 py-2 space-y-0.5">
                              {b.files.map((f) => (
                                <button
                                  key={f}
                                  onClick={() => toast(`打开 ${f}`)}
                                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition bg-transparent ${
                                    isDark ? "hover:bg-white/8" : "hover:bg-[#f0ece0]"
                                  }`}
                                  style={{ fontSize: 12, fontFamily: "ui-monospace, monospace" }}
                                >
                                  <FileText className={`w-3 h-3 shrink-0 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} />
                                  <span className="text-[#5b7fb5] truncate">{f}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        );

                      /* Edit */
                      if (b.kind === "edit")
                        return (
                          <div key={j} className={`rounded-xl border overflow-hidden ${isDark ? "border-white/10" : "border-[#e8e4d8]"}`}>
                            {/* Header */}
                            <div className={`flex items-center gap-2 px-3.5 py-2 border-b ${
                              isDark ? "bg-white/5 border-white/8" : "bg-[#f5f4ef] border-[#e8e4d8]"
                            }`}>
                              <ToolPill icon={PenLine} label="Edit" onClick={() => toast("查看编辑详情")} isDark={isDark} />
                              <button
                                onClick={() => toast(`打开 ${b.file}`)}
                                className="text-[#5b7fb5] hover:underline truncate bg-transparent flex items-center gap-1.5"
                                style={{ fontSize: 12, fontFamily: "ui-monospace, monospace" }}
                              >
                                <FileText className="w-3 h-3 shrink-0" />
                                {b.file}
                              </button>
                              <span className={`ml-auto px-2 py-0.5 rounded text-[#7da77d] ${isDark ? "bg-[#7da77d]/12" : "bg-[#7da77d]/10"}`} style={{ fontSize: 11 }}>
                                1 处变更
                              </span>
                            </div>

                            {/* Before */}
                            <div className={`flex items-center gap-2 px-3.5 py-1.5 border-b ${
                              isDark ? "bg-red-500/5 border-white/6" : "bg-red-50/60 border-[#f0e8e8]"
                            }`}>
                              <span className="w-3.5 h-3.5 flex items-center justify-center rounded-sm bg-red-500/15 text-red-500 shrink-0 leading-none" style={{ fontSize: 10 }}>−</span>
                              <span className={`${isDark ? "text-[#9a9485]" : "text-[#a8a294]"}`} style={{ fontSize: 11 }}>删除</span>
                            </div>
                            <div className={`px-4 py-2.5 border-b ${isDark ? "bg-red-500/[0.04] border-white/6" : "bg-red-50/40 border-[#f0e8e8]"}`}>
                              <code
                                className="text-red-400 line-through"
                                style={{ fontSize: 12, fontFamily: "ui-monospace, monospace", lineHeight: 1.6 }}
                              >
                                {b.before}
                              </code>
                            </div>

                            {/* After */}
                            <div className={`flex items-center gap-2 px-3.5 py-1.5 border-b ${
                              isDark ? "bg-green-500/5 border-white/6" : "bg-green-50/60 border-[#e8f0e8]"
                            }`}>
                              <span className="w-3.5 h-3.5 flex items-center justify-center rounded-sm bg-green-500/15 text-green-500 shrink-0 leading-none" style={{ fontSize: 10 }}>＋</span>
                              <span className={`${isDark ? "text-[#9a9485]" : "text-[#a8a294]"}`} style={{ fontSize: 11 }}>添加</span>
                            </div>
                            <div className={`px-4 py-2.5 ${isDark ? "bg-green-500/[0.04]" : "bg-green-50/40"}`}>
                              <code
                                className="text-green-500"
                                style={{ fontSize: 12, fontFamily: "ui-monospace, monospace", lineHeight: 1.6 }}
                              >
                                {b.after}
                              </code>
                            </div>
                          </div>
                        );

                      return null;
                    })}
                  </div>

                  {/* ── Action toolbar ── */}
                  <div className={`flex items-center gap-0.5 pl-[2.375rem] pt-1 border-t ${isDark ? "border-white/8" : "border-[#f0ece0]"}`}>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(
                          m.blocks?.filter((b) => b.kind === "text").map((b: any) => b.content).join("\n") || ""
                        );
                        toast.success("已复制回复");
                      }}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition active:scale-95 bg-transparent ${
                        isDark ? "hover:bg-white/8 text-[#9a9485] hover:text-[#c8c3b5]" : "hover:bg-[#ebe7d9] text-[#6b6553] hover:text-[#3d3929]"
                      }`}
                      style={{ fontSize: 12 }}
                      title="复制"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>复制</span>
                    </button>
                    <button
                      onClick={() => toast("正在重新生成...")}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition active:scale-95 bg-transparent ${
                        isDark ? "hover:bg-white/8 text-[#9a9485] hover:text-[#c8c3b5]" : "hover:bg-[#ebe7d9] text-[#6b6553] hover:text-[#3d3929]"
                      }`}
                      style={{ fontSize: 12 }}
                      title="重新生成"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>重新生成</span>
                    </button>
                    <button
                      onClick={() => onBranch?.(m.content)}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition active:scale-95 bg-transparent ${
                        isDark ? "hover:bg-white/8 text-[#9a9485] hover:text-[#c8c3b5]" : "hover:bg-[#ebe7d9] text-[#6b6553] hover:text-[#3d3929]"
                      }`}
                      style={{ fontSize: 12 }}
                      title="分支对话"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      <span>分支</span>
                    </button>
                    <div className={`ml-auto flex items-center gap-1 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} style={{ fontSize: 11 }}>
                      <Sparkles className="w-3 h-3" />
                      <span>Sonnet 4.6</span>
                      <span className="mx-1">·</span>
                      <span>~320 tokens</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer input */}
      <div className="px-6 pb-6">
        <div className={`claude-input-glow ${wideMode ? "max-w-5xl" : "max-w-3xl"} mx-auto rounded-2xl border flex flex-col transition-all duration-300 ${
          isDark
            ? "bg-white/5 border-white/10 focus-within:bg-white/8"
            : "bg-[#fdfdfc] border-[#e8e4d8] focus-within:bg-white shadow-sm"
        }`}>
          <textarea
            placeholder="回复 Agent（输入 @ 提及，/ 执行命令）"
            rows={3}
            className={`w-full resize-none outline-none bg-transparent placeholder-[#a8a294] dark:placeholder-[#6b6553] px-4 pt-4 pb-2 leading-relaxed ${isDark ? "text-[#e8e3d8]" : "text-[#3d3929]"}`}
            style={{ fontSize: 15 }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                const v = (e.target as HTMLTextAreaElement).value.trim();
                if (v) { toast.success(`已发送: ${v.slice(0, 30)}`); (e.target as HTMLTextAreaElement).value = ""; }
              }
            }}
          />
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1">

              {/* Model selector */}
              <div className="relative" ref={modelRef}>
                <button
                  onClick={() => setModelOpen((o) => !o)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 bg-transparent ${isDark ? "text-[#c8c3b5] hover:bg-white/8" : "text-[#4d4a42] hover:bg-[#f0ece1]"}`}
                  style={{ fontSize: 13 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="text-[#cc6b3f]">
                    <path d="M12 2C12 2 12.8 8.2 14.8 10.2C16.8 12.2 22 12 22 12C22 12 16.8 11.8 14.8 13.8C12.8 15.8 12 22 12 22C12 22 11.2 15.8 9.2 13.8C7.2 11.8 2 12 2 12C2 12 7.2 12.2 9.2 10.2C11.2 8.2 12 2 12 2Z" />
                  </svg>
                  <span>{selectedModel}</span>
                  <ChevronDown className={`w-3.5 h-3.5 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} />
                </button>

                {modelOpen && (
                  <div className="claude-pop absolute bottom-full left-0 mb-2 w-72 rounded-2xl overflow-hidden z-30" style={glassStyle}>
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
                    <div className="py-2">
                      {models.map((m) => (
                        <button
                          key={m.name}
                          onClick={() => { setSelectedModel(m.name); setModelOpen(false); toast(`已选择模型: ${m.name}`); }}
                          className="w-full flex items-start justify-between px-4 py-2 transition-all text-left bg-transparent"
                          style={{ background: "transparent" }}
                          {...hoverRow}
                        >
                          <div>
                            <div className={isDark ? "text-[#e8e3d8]" : ""} style={{ fontSize: 14 }}>{m.name}</div>
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
                          onClick={() => { setAdaptive((a) => !a); toast(`Adaptive thinking ${!adaptive ? "已开启" : "已关闭"}`); }}
                          className={`w-10 h-6 rounded-full transition-all relative ${adaptive ? "bg-[#5b7fb5]" : isDark ? "bg-white/20" : "bg-[#d9d5c7]"}`}
                          style={{ boxShadow: adaptive ? "0 0 0 3px rgba(91,127,181,0.18)" : "none" }}
                        >
                          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all shadow-sm ${adaptive ? "left-[18px]" : "left-0.5"}`} />
                        </button>
                      </div>
                      <div className="mx-3 my-1 h-px" style={{ background: isDark ? "linear-gradient(to right,transparent,rgba(255,255,255,0.10),transparent)" : "linear-gradient(to right,transparent,rgba(180,170,140,0.35),transparent)" }} />
                      <button
                        onClick={() => { toast("查看更多模型"); setModelOpen(false); }}
                        className={`w-full flex items-center justify-between px-4 py-2 transition-all bg-transparent ${isDark ? "text-[#e8e3d8]" : ""}`}
                        style={{ fontSize: 14, background: "transparent" }}
                        {...hoverRow}
                      >
                        More models
                        <ChevronRight className={`w-4 h-4 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Thinking depth */}
              <div className="relative" ref={modeRef}>
                <button
                  onClick={() => setModeOpen((o) => !o)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all active:scale-95 bg-transparent ${
                    selectedMode === "关闭"
                      ? isDark ? "text-[#6b6553] hover:bg-white/8" : "text-[#a8a294] hover:bg-[#f0ece1]"
                      : isDark ? "text-[#5b7fb5] hover:bg-[#5b7fb5]/15" : "text-[#5b7fb5] hover:bg-[#eef1f8]"
                  }`}
                  style={{ fontSize: 13 }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 1.98-3A2.5 2.5 0 0 1 9.5 2Z"/>
                    <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-1.98-3A2.5 2.5 0 0 0 14.5 2Z"/>
                  </svg>
                  <span>{selectedMode}</span>
                  <ChevronDown className={`w-3 h-3 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} />
                </button>

                {modeOpen && (
                  <div className="claude-pop absolute bottom-full left-0 mb-2 w-64 rounded-2xl overflow-hidden z-30" style={glassStyle}>
                    <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent pointer-events-none" />
                    <div className="px-3 pt-3 pb-1">
                      <div className={`px-1 mb-1.5 ${isDark ? "text-[#6b6553]" : "text-[#a8a294]"}`} style={{ fontSize: 11, letterSpacing: "0.04em" }}>思考深度</div>
                    </div>
                    <div className="pb-2">
                      {thinkingModes.map((m) => {
                        const bars = ({ "关闭": 0, "自动": -1, "低": 1, "中": 2, "高": 3 } as Record<string, number>)[m.label] ?? -1;
                        const isActive = selectedMode === m.label;
                        return (
                          <button
                            key={m.label}
                            onClick={() => { setSelectedMode(m.label); toast(`思考深度已设为: ${m.label}`); setModeOpen(false); }}
                            className="w-full flex items-center justify-between px-4 py-2 transition-all text-left bg-transparent"
                            style={{ background: "transparent" }}
                            {...hoverRow}
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="flex items-end gap-0.5 w-5 h-4 shrink-0">
                                {bars === -1 ? (
                                  [0.6, 1, 0.7].map((h, i) => (
                                    <div key={i} className="flex-1 rounded-sm bg-[#5b7fb5] opacity-80" style={{ height: `${h * 100}%` }} />
                                  ))
                                ) : bars === 0 ? (
                                  <div className={`w-full h-0.5 rounded-full self-center ${isDark ? "bg-white/20" : "bg-[#c8c3b5]"}`} />
                                ) : (
                                  [1, 2, 3].map((b) => (
                                    <div key={b} className="flex-1 rounded-sm transition-all"
                                      style={{ height: `${(b / 3) * 100}%`, background: b <= bars ? "#5b7fb5" : isDark ? "rgba(255,255,255,0.12)" : "rgba(180,170,140,0.3)" }}
                                    />
                                  ))
                                )}
                              </div>
                              <div>
                                <div style={{ fontSize: 13 }} className={isActive ? (isDark ? "text-[#e8e3d8]" : "text-[#3d3929]") : (isDark ? "text-[#c8c3b5]" : "text-[#4d4a42]")}>{m.label}</div>
                                <div className={isDark ? "text-[#6b6553]" : "text-[#a8a294]"} style={{ fontSize: 11 }}>{m.desc}</div>
                              </div>
                            </div>
                            {isActive && <Check className="w-3.5 h-3.5 text-[#5b7fb5] shrink-0" />}
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
                className={`p-1.5 rounded-lg transition-all active:scale-95 bg-transparent ${isDark ? "text-[#6b6553] hover:text-[#9a9485] hover:bg-white/8" : "text-[#8b877a] hover:text-[#4d4a42] hover:bg-[#f0ece1]"}`}
              >
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
                </svg>
              </button>
              <button
                onClick={(e) => {
                  const textarea = e.currentTarget.closest(".flex.flex-col")?.querySelector("textarea");
                  if (textarea && textarea.value.trim()) {
                    toast.success(`已发送: ${textarea.value.trim().slice(0, 30)}`);
                    textarea.value = "";
                  } else {
                    toast.error("请输入回复内容");
                  }
                }}
                className="claude-btn claude-send-pulse flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-[#d6754f] to-[#b85535] hover:from-[#dc8059] hover:to-[#bf5a3a] text-white shadow-[0_4px_14px_rgba(201,100,66,0.32)]"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 2L11 13"/><path d="M22 2L15 22L11 13L2 9L22 2Z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}