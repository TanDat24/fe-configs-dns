import { NextResponse } from "next/server";
import { observe } from "@/lib/server/observability";

type RateWindow = {
  count: number;
  resetAt: number;
};

const rateStore = new Map<string, RateWindow>();

function getClientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return request.headers.get("x-real-ip") || "unknown";
}

function normalizeOrigin(value: string): string {
  try {
    const parsed = new URL(value);
    return `${parsed.protocol}//${parsed.host}`.toLowerCase();
  } catch {
    return "";
  }
}

function getAllowedOrigins(request: Request): string[] {
  const raw = process.env.INTERNAL_API_ALLOWED_ORIGINS;
  if (!raw) {
    const origin = request.headers.get("origin");
    if (!origin) return [];
    const normalized = normalizeOrigin(origin);
    return normalized ? [normalized] : [];
  }

  return raw
    .split(",")
    .map((item) => normalizeOrigin(item.trim()))
    .filter(Boolean);
}

export function createRequestId(): string {
  return crypto.randomUUID();
}

export function logApiError(
  requestId: string,
  route: string,
  err: unknown,
  extra?: Record<string, unknown>,
): void {
  const payload = {
    requestId,
    route,
    ...(extra ?? {}),
    error: err instanceof Error ? err.message : String(err),
  };
  console.error("[api_error]", payload);
  void observe({
    level: "error",
    message: "api_error",
    requestId,
    route,
    data: payload,
  });
}

export function sanitizeApiMessage(status: number, fallback: string): string {
  if (status >= 500) return "He thong tam thoi gian doan. Vui long thu lai sau.";
  if (status === 401) return "Ban can dang nhap de tiep tuc.";
  if (status === 403) return "Yeu cau bi tu choi.";
  return fallback;
}

export function errorResponse(message: string, status: number, requestId: string): NextResponse {
  return NextResponse.json({ message, requestId }, { status });
}

export function enforceRateLimit(input: {
  request: Request;
  namespace: string;
  max: number;
  windowMs: number;
}): { ok: true } | { ok: false; retryAfterSec: number } {
  const ip = getClientIp(input.request);
  const key = `${input.namespace}:${ip}`;
  const now = Date.now();
  const current = rateStore.get(key);

  if (!current || now >= current.resetAt) {
    rateStore.set(key, { count: 1, resetAt: now + input.windowMs });
    return { ok: true };
  }

  if (current.count >= input.max) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((current.resetAt - now) / 1000)) };
  }

  current.count += 1;
  rateStore.set(key, current);
  return { ok: true };
}

export function verifySameOriginCsrf(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return true;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  return getAllowedOrigins(request).includes(normalizedOrigin);
}
