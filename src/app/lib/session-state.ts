import type { ServerEvent, SessionDetail, SessionSummary } from "../types";

export function evolveSession(
  current: SessionDetail | null,
  event: ServerEvent,
): SessionDetail | null {
  if (event.type === "session.snapshot") {
    return event.session;
  }

  if (!current) {
    return current;
  }

  if (event.type === "session.message") {
    return {
      ...current,
      messages: mergeMessages(current.messages, event.message),
      updatedAt: event.message.createdAt,
    };
  }

  return {
    ...current,
    exitCode: event.exitCode,
    status: event.status,
    updatedAt: new Date().toISOString(),
  };
}

export function mergeSessionSummary(
  sessions: SessionSummary[],
  session: SessionDetail | SessionSummary,
): SessionSummary[] {
  const summary = {
    ...session,
    lastMessagePreview:
      "messages" in session
        ? session.messages.at(-1)?.content.slice(0, 80) ?? ""
        : session.lastMessagePreview,
  };

  return [summary, ...sessions.filter((current) => current.id !== session.id)];
}

export function pickActiveSessionId(
  current: string | null,
  sessions: SessionSummary[],
): string | null {
  if (current && sessions.some((session) => session.id === current)) {
    return current;
  }

  return sessions[0]?.id ?? null;
}

function mergeMessages(
  messages: SessionDetail["messages"],
  nextMessage: SessionDetail["messages"][number],
): SessionDetail["messages"] {
  const currentIndex = messages.findIndex((message) => message.id === nextMessage.id);
  if (currentIndex === -1) {
    return [...messages, nextMessage];
  }

  return messages.map((message) =>
    message.id === nextMessage.id ? nextMessage : message,
  );
}
