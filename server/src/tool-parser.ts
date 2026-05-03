import type { ToolBlock } from "./types.js";

const ESCAPE_CHAR = String.fromCharCode(27);
const ANSI_PATTERN = new RegExp(`${ESCAPE_CHAR}\\[[0-9;?]*[ -/]*[@-~]`, "g");
const TOOL_PATTERN =
  /^(thinking|思考|子agent|subagent|agent|task|bash|shell|grep|search|edit|write|multiedit|read)\s*[:：-]?\s*(.*)$/i;
const BEFORE_PATTERN = /^(before|修改前)\s*[:：]?$/i;
const AFTER_PATTERN = /^(after|修改后)\s*[:：]?$/i;
const ENGLISH_TAIL_PATTERN = /^(done|completed|finished|resolved|updated)\b.*[.!?]?$/i;

type ToolKind = "thinking" | "agent" | "bash" | "grep" | "edit";
type EditAction = "edit" | "write" | "multiedit" | "read";

interface ToolMatch {
  kind: ToolKind;
  toolName: string;
  payload: string;
  rawTool: string;
}

interface ToolSection {
  match: ToolMatch;
  body: string[];
}

interface FileChangeDetails {
  after: string;
  before: string;
  excerpt: string;
  trailingText: string[];
}

export function stripAnsi(content: string): string {
  return content.replace(ANSI_PATTERN, "");
}

export function deriveBlocks(content: string): ToolBlock[] {
  const clean = stripAnsi(content).trim();
  if (!clean) {
    return [];
  }

  const blocks: ToolBlock[] = [];
  const textBuffer: string[] = [];
  let currentSection: ToolSection | null = null;

  for (const line of clean.split(/\r?\n/)) {
    const match = matchToolHeader(line);
    if (!match) {
      appendLine(currentSection, textBuffer, line);
      continue;
    }

    flushToolSection(blocks, currentSection);
    currentSection = { match, body: [] };
    flushTextBlock(blocks, textBuffer);
  }

  flushToolSection(blocks, currentSection);
  flushTextBlock(blocks, textBuffer);
  return blocks.length > 0 ? blocks : [{ kind: "text", content: clean }];
}

function appendLine(
  currentSection: ToolSection | null,
  textBuffer: string[],
  line: string,
): void {
  if (currentSection) {
    currentSection.body.push(line);
    return;
  }

  textBuffer.push(line);
}

function flushTextBlock(blocks: ToolBlock[], textBuffer: string[]): void {
  const content = textBuffer.join("\n").trim();
  textBuffer.length = 0;
  if (!content) {
    return;
  }

  blocks.push({ kind: "text", content });
}

function flushToolSection(
  blocks: ToolBlock[],
  section: ToolSection | null,
): void {
  if (!section) {
    return;
  }

  const { block, trailingText } = toToolBlock(section);
  blocks.push(block);
  if (trailingText.length > 0) {
    blocks.push({ kind: "text", content: trailingText.join("\n") });
  }
}

function matchToolHeader(line: string): ToolMatch | null {
  const match = line.trim().match(TOOL_PATTERN);
  if (!match) {
    return null;
  }

  const rawTool = match[1].toLowerCase();
  return {
    kind: toToolKind(rawTool),
    toolName: toToolName(rawTool),
    payload: match[2].trim(),
    rawTool,
  };
}

function toToolKind(rawTool: string): ToolKind {
  if (rawTool === "thinking" || rawTool === "思考") {
    return "thinking";
  }

  if (
    rawTool === "子agent" ||
    rawTool === "subagent" ||
    rawTool === "agent" ||
    rawTool === "task"
  ) {
    return "agent";
  }

  if (rawTool === "bash" || rawTool === "shell") {
    return "bash";
  }

  if (rawTool === "grep" || rawTool === "search") {
    return "grep";
  }

  return "edit";
}

function toToolName(rawTool: string): string {
  if (rawTool === "思考") {
    return "思考";
  }

  if (rawTool === "子agent") {
    return "子Agent";
  }

  if (rawTool === "subagent") {
    return "Subagent";
  }

  if (rawTool === "multiedit") {
    return "MultiEdit";
  }

  return `${rawTool[0]?.toUpperCase() ?? ""}${rawTool.slice(1)}`;
}

function toToolBlock(
  section: ToolSection,
): { block: ToolBlock; trailingText: string[] } {
  if (section.match.kind === "thinking") {
    return toThinkingBlock(section);
  }

  if (section.match.kind === "agent") {
    return toAgentBlock(section);
  }

  if (section.match.kind === "bash") {
    return toBashBlock(section);
  }

  if (section.match.kind === "grep") {
    return toGrepBlock(section);
  }

  return toEditBlock(section);
}

function toThinkingBlock(section: ToolSection): { block: ToolBlock; trailingText: string[] } {
  const content = [section.match.payload, ...section.body]
    .map((line) => line.trim())
    .filter(Boolean);

  return {
    block: {
      kind: "thinking",
      toolName: section.match.toolName,
      steps: content.length || 1,
      content: content.length > 0 ? content : ["Claude 正在推理当前请求。"],
    },
    trailingText: [],
  };
}

function toAgentBlock(section: ToolSection): { block: ToolBlock; trailingText: string[] } {
  const { keptLines, trailingText } = splitTrailingNarrativeLines(section.body, false);
  const details = keptLines.map((line) => line.trim()).filter(Boolean);
  return {
    block: {
      kind: "agent",
      toolName: section.match.toolName,
      agent: section.match.payload || "unknown",
      status: findStatus(details),
      details,
    },
    trailingText,
  };
}

function toBashBlock(section: ToolSection): { block: ToolBlock; trailingText: string[] } {
  const { keptLines, trailingText } = splitTrailingNarrativeLines(section.body, true);
  return {
    block: {
      kind: "bash",
      toolName: section.match.toolName,
      cmd: section.match.payload || "claude",
      output: keptLines.join("\n").trim(),
    },
    trailingText,
  };
}

function toGrepBlock(section: ToolSection): { block: ToolBlock; trailingText: string[] } {
  const keptLines = [...section.body];
  const trailingText: string[] = [];
  while (keptLines.length > 1 && !looksLikeFileMatch(keptLines[keptLines.length - 1]?.trim() ?? "")) {
    trailingText.unshift(keptLines.pop()!.trim());
  }

  return {
    block: {
      kind: "grep",
      toolName: section.match.toolName,
      pattern: section.match.payload,
      files: keptLines
        .map((line) => line.trim())
        .filter(looksLikeFileMatch),
    },
    trailingText,
  };
}

function toEditBlock(section: ToolSection): { block: ToolBlock; trailingText: string[] } {
  const details = parseFileChangeDetails(section.body);
  return {
    block: {
      kind: "edit",
      toolName: section.match.toolName,
      action: toEditAction(section.match.rawTool),
      file: section.match.payload || "unknown",
      before: details.before,
      after: details.after,
      excerpt: details.excerpt,
    },
    trailingText: details.trailingText,
  };
}

function findStatus(details: string[]): string {
  const statusLine = details.find((line) => /^(status|状态)\s*[:：]/i.test(line));
  return statusLine ? statusLine.replace(/^(status|状态)\s*[:：]\s*/i, "") : "";
}

function looksLikeFileMatch(line: string): boolean {
  return /[\\/]/.test(line) || /\.[A-Za-z0-9]+(?::\d+)?$/.test(line);
}

function toEditAction(rawTool: string): EditAction {
  if (rawTool === "write") {
    return "write";
  }

  if (rawTool === "multiedit") {
    return "multiedit";
  }

  if (rawTool === "read") {
    return "read";
  }

  return "edit";
}

function parseFileChangeDetails(body: string[]): FileChangeDetails {
  const beforeLines: string[] = [];
  const afterLines: string[] = [];
  const excerptLines: string[] = [];
  let target: "before" | "after" | "excerpt" = "excerpt";

  for (const rawLine of body) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (BEFORE_PATTERN.test(line)) {
      target = "before";
      continue;
    }

    if (AFTER_PATTERN.test(line)) {
      target = "after";
      continue;
    }

    if (target === "excerpt" && line.startsWith("-")) {
      beforeLines.push(line.slice(1).trim());
      continue;
    }

    if (target === "excerpt" && line.startsWith("+")) {
      afterLines.push(line.slice(1).trim());
      continue;
    }

    pushDetailLine(target, line, beforeLines, afterLines, excerptLines);
  }

  const afterResult = splitTrailingNarrativeLines(afterLines, false);
  const excerptResult = splitTrailingNarrativeLines(excerptLines, false);
  const excerpt = beforeLines.length === 0 && afterResult.keptLines.length === 0
    ? excerptResult.keptLines.join("\n")
    : "";

  return {
    after: afterResult.keptLines.join("\n"),
    before: beforeLines.join("\n"),
    excerpt,
    trailingText: afterResult.trailingText.length > 0
      ? afterResult.trailingText
      : excerptResult.trailingText,
  };
}

function pushDetailLine(
  target: "before" | "after" | "excerpt",
  line: string,
  beforeLines: string[],
  afterLines: string[],
  excerptLines: string[],
): void {
  if (target === "before") {
    beforeLines.push(line);
    return;
  }

  if (target === "after") {
    afterLines.push(line);
    return;
  }

  excerptLines.push(line);
}

function splitTrailingNarrativeLines(
  lines: string[],
  allowFullTail: boolean,
): { keptLines: string[]; trailingText: string[] } {
  const keptLines = [...lines];
  const trailingText: string[] = [];
  while (
    keptLines.length > 0 &&
    looksLikeNarrativeTail(keptLines[keptLines.length - 1] ?? "") &&
    (allowFullTail || keptLines.length > 1)
  ) {
    trailingText.unshift(keptLines.pop()!.trim());
  }

  return { keptLines, trailingText };
}

function looksLikeNarrativeTail(line: string): boolean {
  const trimmed = line.trim();
  if (!trimmed || looksLikeFileMatch(trimmed) || looksLikeCodeLine(trimmed) || looksLikeShellOutput(trimmed)) {
    return false;
  }

  return /[\u4e00-\u9fff]/.test(trimmed) ? /[。！？]$/.test(trimmed) : ENGLISH_TAIL_PATTERN.test(trimmed);
}

function looksLikeCodeLine(line: string): boolean {
  return /[;{}()[\]=<>`]/.test(line) || /^(const|let|var|function|class|interface|type|import|export|return)\b/.test(line);
}

function looksLikeShellOutput(line: string): boolean {
  return /^(>|\$|#|\.\.\.|npm\s|pnpm\s|yarn\s)/.test(line);
}
