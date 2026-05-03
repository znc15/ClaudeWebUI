import crypto from "node:crypto";

import type { Request, Response } from "express";

export function isAuthorized(request: Request, password: string | null): boolean {
  if (!password) {
    return true;
  }

  const candidate =
    request.header("x-claude-webui-password") ??
    getBearerToken(request.header("authorization")) ??
    null;

  if (!candidate) {
    return false;
  }

  return safeCompare(candidate, password);
}

export function sendUnauthorized(response: Response): void {
  response.status(401).json({
    error: "Password required",
  });
}

export function isWebSocketAuthorized(
  password: string | null,
  candidate: string | null,
): boolean {
  if (!password) {
    return true;
  }

  if (!candidate) {
    return false;
  }

  return safeCompare(candidate, password);
}

function getBearerToken(headerValue: string | undefined): string | null {
  if (!headerValue?.startsWith("Bearer ")) {
    return null;
  }

  return headerValue.slice("Bearer ".length);
}

function safeCompare(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
