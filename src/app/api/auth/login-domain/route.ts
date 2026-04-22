import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME, wpAuthCookieOptions } from "@/lib/auth-cookie";
import type {
  LoginDomainRequestDto,
  LoginDomainResponseDto,
} from "@/lib/contracts/api";
import {
  createRequestId,
  enforceRateLimit,
  errorResponse,
  logApiError,
  sanitizeApiMessage,
  verifySameOriginCsrf,
} from "@/lib/server/request-security";
import { loginDomainSchema, parseBodyOrThrow } from "@/lib/server/validators";
import { wpGraphqlLoginWithDomain } from "@/lib/server/wp-login-domain";

const AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  const requestId = createRequestId();
  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) {
    return errorResponse("Cau hinh he thong chua day du.", 500, requestId);
  }

  if (!verifySameOriginCsrf(request)) {
    return errorResponse("Yeu cau khong hop le.", 403, requestId);
  }

  const limit = enforceRateLimit({
    request,
    namespace: "auth_login_domain",
    max: 10,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      {
        message: "Ban thao tac qua nhanh. Vui long thu lai sau.",
        requestId,
        retryAfterSec: limit.retryAfterSec,
      },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Du lieu khong hop le.", 400, requestId);
  }

  let payload: LoginDomainRequestDto;
  try {
    payload = parseBodyOrThrow(loginDomainSchema, body);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Du lieu khong hop le.",
      400,
      requestId,
    );
  }

  const result = await wpGraphqlLoginWithDomain(
    endpoint,
    payload.domain,
    payload.password,
  );
  if (!result.ok) {
    logApiError(requestId, "/api/auth/login-domain", result.message, {
      status: result.status,
    });
    return errorResponse(
      sanitizeApiMessage(result.status, result.message || "Dang nhap that bai."),
      result.status,
      requestId,
    );
  }

  const responseBody: LoginDomainResponseDto = {
    authToken: result.authToken,
    username: result.username,
    domain: result.domain,
  };
  const res = NextResponse.json(responseBody);
  res.cookies.set(
    WP_AUTH_COOKIE_NAME,
    result.authToken,
    wpAuthCookieOptions(AUTH_COOKIE_MAX_AGE_SEC, request),
  );
  return res;
}
