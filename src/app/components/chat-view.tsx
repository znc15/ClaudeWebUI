import { useEffect, useRef } from "react";
import {
  Bot,
  Command,
  Search,
  Sparkles,
  Terminal,
  WandSparkles,
} from "lucide-react";

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
}

const EDIT_ACTION_LABELS = {
  edit: "Edit",
  multiedit: "MultiEdit",
  read: "Read",
  write: "Write",
} as const;

export function ChatView({
  connectionLabel,
  draft,
  isDark,
  onDraftChange,
  onSend,
  session,
  socketReady,
  socketStatus,
}: ChatViewProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session?.messages]);

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
            左侧先确认后端地址与密码是否正确，然后创建或选择一个会话。连接成功后，
            这里会实时展示 Claude CLI 的回复、工具调用和退出状态。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="border-b border-black/8 px-4 py-4 dark:border-white/10 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <h2 className="font-serif text-2xl text-[#342d22] dark:text-[#f1e9de]">
              {session.title}
            </h2>
            <p className="mt-1 text-sm text-[#7f7362] dark:text-[#aa9e90]">
              {session.cwd}
            </p>
          </div>
          <span className="rounded-full bg-[#cc6b3f]/12 px-3 py-1 text-sm text-[#a4502d] dark:text-[#f0c2aa]">
            {session.status}
          </span>
          {session.exitCode !== null ? (
            <span className="rounded-full bg-[#dfd5ca] px-3 py-1 text-sm text-[#665a48] dark:bg-[#342f29] dark:text-[#d9d0c4]">
              exit {session.exitCode}
            </span>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-[#827664] dark:text-[#aa9f91]">
          {connectionLabel} · {socketStatus.detail}
        </p>
      </div>

      <div ref={scrollRef} className="flex-1 space-y-6 overflow-y-auto px-4 py-6 md:px-6">
        {session.messages.map((message) => (
          <MessageCard key={message.id} isDark={isDark} message={message} />
        ))}
      </div>

      <div className="border-t border-black/8 px-4 py-4 dark:border-white/10 md:px-6">
        <div
          className={`rounded-[1.75rem] border p-3 ${
            isDark ? "border-white/10 bg-white/5" : "border-black/8 bg-white/85"
          }`}
        >
          <textarea
            className="min-h-24 w-full resize-none bg-transparent px-3 py-2 text-sm leading-7 text-[#342d22] outline-none placeholder:text-[#968978] dark:text-[#f2e9dc] dark:placeholder:text-[#7c7166]"
            disabled={!socketReady || session.status === "exited"}
            onChange={(event) => onDraftChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                onSend();
              }
            }}
            placeholder={buildDraftPlaceholder(session.status, socketStatus.detail)}
            value={draft}
          />
          <div className="flex items-center justify-between gap-3 px-2 pb-1 pt-2">
            <p className="text-xs text-[#827664] dark:text-[#aa9f91]">
              Claude CLI 输出会按工具块自动分段展示。
            </p>
            <button
              className="rounded-full bg-[#cc6b3f] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#b85f37] disabled:cursor-not-allowed disabled:bg-[#c7b8a9]"
              disabled={!socketReady || !draft.trim() || session.status === "exited"}
              onClick={onSend}
            >
              发送
            </button>
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
        {fromUser ? <Command className="size-3.5" /> : <Bot className="size-3.5" />}
        {message.role}
      </div>
      <div className={`rounded-[1.75rem] border border-black/8 p-4 shadow-sm dark:border-white/10 ${bubble}`}>
        <p className="whitespace-pre-wrap text-sm leading-7">{message.content || "Claude 正在输出..."}</p>
        <div className="mt-4 space-y-3">
          {message.blocks.map((block, index) => (
            <ToolBlockView key={`${message.id}-${index}`} block={block} isDark={isDark} />
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
        <Header icon={<WandSparkles className="size-4" />} title={resolveBlockLabel(block)}>
          {block.steps} steps
        </Header>
        <div className="mt-2 space-y-2 text-sm leading-6 text-[#7c6f5f] dark:text-[#b5a89a]">
          {block.content.map((item, index) => (
            <p key={`${block.toolName}-${index}`}>{item}</p>
          ))}
        </div>
      </section>
    );
  }

  if (block.kind === "agent") {
    return (
      <section className={`rounded-2xl border p-3 ${panel}`}>
        <Header icon={<Bot className="size-4" />} title={resolveBlockLabel(block)}>
          {block.agent}
        </Header>
        <MetaRow label="状态" value={block.status || "unknown"} />
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
      <section className={`rounded-2xl border p-3 ${panel}`}>
        <Header icon={<Terminal className="size-4" />} title={resolveBlockLabel(block)}>
          {block.cmd}
        </Header>
        <CodeSection label="命令">{block.cmd}</CodeSection>
        {block.output ? <CodeSection label="输出">{block.output}</CodeSection> : null}
      </section>
    );
  }

  if (block.kind === "grep") {
    return (
      <section className={`rounded-2xl border p-3 ${panel}`}>
        <Header icon={<Search className="size-4" />} title={resolveBlockLabel(block)}>
          {block.pattern}
        </Header>
        <MetaRow label="模式" value={block.pattern || "搜索模式为空"} />
        {block.files.length > 0 ? <CodeSection label="命中">{block.files.join("\n")}</CodeSection> : null}
      </section>
    );
  }

  return (
    <section className={`rounded-2xl border p-3 ${panel}`}>
      <Header icon={<Command className="size-4" />} title={resolveBlockLabel(block)}>
        {block.file}
      </Header>
      <MetaRow label="文件" value={block.file} />
      {block.excerpt ? <CodeSection label="摘录">{block.excerpt}</CodeSection> : null}
      {block.before ? <CodeSection label="Before">{block.before}</CodeSection> : null}
      {block.after ? <CodeSection label="After">{block.after}</CodeSection> : null}
    </section>
  );
}

function Header({
  children,
  icon,
  title,
}: {
  children?: React.ReactNode;
  icon: React.ReactNode;
  title: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 text-sm font-medium">
      <div className="flex items-center gap-2">
        {icon}
        <span>{title}</span>
      </div>
      {children ? <span className="text-xs text-[#8c806f] dark:text-[#9e9284]">{children}</span> : null}
    </div>
  );
}

function MetaRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <p className="mt-2 text-sm text-[#7c6f5f] dark:text-[#b5a89a]">
      <span className="font-medium text-[#544a3d] dark:text-[#ddd1c3]">{label}:</span> {value}
    </p>
  );
}

function CodeSection({
  children,
  label,
}: {
  children: string;
  label: string;
}) {
  return (
    <div className="mt-2">
      <p className="mb-1 text-xs uppercase tracking-[0.16em] text-[#8c806f] dark:text-[#9e9284]">
        {label}
      </p>
      <pre className="overflow-x-auto rounded-xl bg-black/6 px-3 py-2 text-xs dark:bg-white/6">
        <code>{children}</code>
      </pre>
    </div>
  );
}

function resolveBlockLabel(block: Exclude<ToolBlock, { kind: "text" }>): string {
  if (block.kind === "thinking") {
    return block.toolName === "思考" ? "思考" : "Thinking";
  }

  if (block.kind === "agent") {
    return ["子Agent", "Task", "Subagent", "Agent"].includes(block.toolName)
      ? block.toolName
      : "Agent";
  }

  if (block.kind === "bash") {
    return block.toolName === "Shell" ? "Shell" : "Bash";
  }

  if (block.kind === "grep") {
    return block.toolName === "Search" ? "Search" : "Grep";
  }

  return EDIT_ACTION_LABELS[block.action];
}

function buildDraftPlaceholder(status: SessionDetail["status"], detail: string): string {
  if (status === "exited") {
    return "该会话已经退出，请新建一个会话继续。";
  }

  return `当前不可发送：${detail}`;
}
