import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME, wpAuthCookieOptions } from "@/lib/auth-cookie";
import type { RegisterRequestDto, RegisterResponseDto } from "@/lib/contracts/api";
import {
  createRequestId,
  enforceRateLimit,
  errorResponse,
  logApiError,
  verifySameOriginCsrf,
} from "@/lib/server/request-security";
import { parseBodyOrThrow, registerSchema } from "@/lib/server/validators";
import { wpGraphqlLogin } from "@/lib/server/wp-login";
import { wpRegisterUser } from "@/lib/server/wp-register";

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
    namespace: "auth_register",
    max: 5,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { message: "Ban thao tac qua nhanh. Vui long thu lai sau.", requestId, retryAfterSec: limit.retryAfterSec },
      { status: 429 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Du lieu khong hop le.", 400, requestId);
  }

  let payload: RegisterRequestDto;
  try {
    payload = parseBodyOrThrow(registerSchema, body);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Du lieu khong hop le.", 400, requestId);
  }

  const result = await wpRegisterUser(endpoint, payload.username, payload.email, payload.password);
  if (!result.ok) {
    logApiError(requestId, "/api/auth/register", result.message, { status: result.status });
    return errorResponse(result.message, result.status, requestId);
  }

  const loginResult = await wpGraphqlLogin(endpoint, payload.username, payload.password);
  if (!loginResult.ok) {
    const responseBody: RegisterResponseDto = { message: result.message };
    return NextResponse.json(responseBody);
  }

  const responseBody: RegisterResponseDto = { message: result.message, authToken: loginResult.authToken };
  const res = NextResponse.json(responseBody);
  res.cookies.set(WP_AUTH_COOKIE_NAME, loginResult.authToken, wpAuthCookieOptions(AUTH_COOKIE_MAX_AGE_SEC, request));
  return res;
}
