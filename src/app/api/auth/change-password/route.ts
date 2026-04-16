import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import type { ChangePasswordRequestDto, ChangePasswordResponseDto } from "@/lib/contracts/api";
import {
  createRequestId,
  enforceRateLimit,
  errorResponse,
  logApiError,
  sanitizeApiMessage,
  verifySameOriginCsrf,
} from "@/lib/server/request-security";
import { changePasswordSchema, parseBodyOrThrow } from "@/lib/server/validators";
import { wpGraphqlChangePassword } from "@/lib/server/wp-change-password";

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
    namespace: "auth_change_password",
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

  const cookieStore = await cookies();
  const token = cookieStore.get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return errorResponse("Ban can dang nhap de tiep tuc.", 401, requestId);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Du lieu khong hop le.", 400, requestId);
  }

  let payload: ChangePasswordRequestDto;
  try {
    payload = parseBodyOrThrow(changePasswordSchema, body);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Du lieu khong hop le.", 400, requestId);
  }

  const result = await wpGraphqlChangePassword(endpoint, token, {
    oldPassword: payload.oldPassword,
    newPassword: payload.newPassword,
    confirmPassword: payload.confirmPassword,
  });

  if (!result.ok) {
    logApiError(requestId, "/api/auth/change-password", result.message, { status: result.status });
    return errorResponse(sanitizeApiMessage(result.status, "Khong the doi mat khau."), result.status, requestId);
  }

  const responseBody: ChangePasswordResponseDto = { message: result.message };
  return NextResponse.json(responseBody);
}
