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

function isProductionRuntime(): boolean {
  return process.env.NODE_ENV === "production";
}

/** SECURITY FIX: reject wildcard / invalid origins — no open CORS in production. */
function parseAllowedOriginsList(raw: string): string[] {
  const out: string[] = [];
  for (const item of raw.split(",")) {
    const trimmed = item.trim();
    if (!trimmed || trimmed === "*" || trimmed.includes("*")) {
      continue;
    }
    const normalized = normalizeOrigin(trimmed);
    if (!normalized) continue;
    try {
      const host = new URL(normalized).hostname;
      if (host === "localhost" || host === "127.0.0.1") {
        if (isProductionRuntime()) continue;
      }
    } catch {
      continue;
    }
    out.push(normalized);
  }
  return [...new Set(out)];
}

function getAllowedOrigins(request: Request): string[] {
  const raw = process.env.INTERNAL_API_ALLOWED_ORIGINS?.trim() ?? "";

  if (raw !== "") {
    return parseAllowedOriginsList(raw);
  }

  // SECURITY FIX: production must set INTERNAL_API_ALLOWED_ORIGINS explicitly.
  if (isProductionRuntime()) {
    return [];
  }

  const origin = request.headers.get("origin");
  if (!origin) return [];
  const normalized = normalizeOrigin(origin);
  return normalized ? [normalized] : [];
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
  if (status === 401) {
    // Khong ghi de thong bao loi cu the tu GraphQL (sai mat khau, ten mien, v.v.).
    if (fallback && !fallback.toLowerCase().includes("dang nhap that bai")) {
      return fallback;
    }
    return "Ban can dang nhap de tiep tuc.";
  }
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

function isLocalDevOrigin(origin: string): boolean {
  if (isProductionRuntime()) return false;
  try {
    const host = new URL(origin).hostname;
    return host === "localhost" || host === "127.0.0.1";
  } catch {
    return false;
  }
}

export function verifySameOriginCsrf(request: Request): boolean {
  const method = request.method.toUpperCase();
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method)) return true;

  const origin = request.headers.get("origin");
  if (!origin) return false;

  const normalizedOrigin = normalizeOrigin(origin);
  if (!normalizedOrigin) return false;

  if (isLocalDevOrigin(normalizedOrigin)) return true;

  return getAllowedOrigins(request).includes(normalizedOrigin);
}
