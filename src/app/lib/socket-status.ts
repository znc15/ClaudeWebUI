import type { SocketPhase, SocketStatus } from "../types";

export const SOCKET_MAX_ATTEMPTS = 3;
export const SOCKET_RETRY_DELAY_MS = 1500;

const NON_RETRYABLE_CLOSE_CODES = new Set([1008]);

export function createSocketStatus(
  phase: SocketPhase,
  detail: string,
  attempts = 0,
): SocketStatus {
  return { phase, detail, attempts };
}

export function describeSocketClose(code: number, reason: string): string {
  if (reason.trim()) {
    return reason.trim();
  }

  return code === 1000 ? "连接已关闭" : `连接已断开 (${code})`;
}

export function shouldRetrySocket(code: number, reason: string): boolean {
  if (NON_RETRYABLE_CLOSE_CODES.has(code)) {
    return false;
  }

  return !/not found|sessionid|password|auth/i.test(reason);
}
