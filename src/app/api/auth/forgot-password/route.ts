import { NextResponse } from "next/server";
import type { ForgotPasswordRequestDto, ForgotPasswordResponseDto } from "@/lib/contracts/api";
import {
  createRequestId,
  enforceRateLimit,
  errorResponse,
  logApiError,
  sanitizeApiMessage,
  verifySameOriginCsrf,
} from "@/lib/server/request-security";
import { forgotPasswordSchema, parseBodyOrThrow } from "@/lib/server/validators";
import { wpGraphqlForgotPassword } from "@/lib/server/wp-forgot-password";

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
    namespace: "auth_forgot_password",
    max: 5,
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

  let payload: ForgotPasswordRequestDto;
  try {
    payload = parseBodyOrThrow(forgotPasswordSchema, body);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Du lieu khong hop le.", 400, requestId);
  }

  const result = await wpGraphqlForgotPassword(endpoint, payload.email);
  if (!result.ok) {
    logApiError(requestId, "/api/auth/forgot-password", result.message, { status: result.status });
    return errorResponse(sanitizeApiMessage(result.status, "Khong the xu ly yeu cau."), result.status, requestId);
  }

  const responseBody: ForgotPasswordResponseDto = {
    message: result.message,
    clientMutationId: result.clientMutationId ?? undefined,
  };

  return NextResponse.json(responseBody);
}
