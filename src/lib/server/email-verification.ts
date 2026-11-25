import "server-only";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import {
  createRequestId,
  enforceRateLimit,
  logApiError,
  verifySameOriginCsrf,
} from "./request-security";
import { getWpGraphqlEndpoint } from "./wp-graphql-client";
import { sendEmailVerificationSchema, verifyEmailSchema } from "./validators";
import { wpGetEmailVerificationStatus, wpSendEmailVerificationCode, wpVerifyEmailCode } from "./wp-email-verification";

export async function emailVerificationStatusResponse() {
  const requestId = createRequestId();
  const respond = (body: object, status = 200) => NextResponse.json(
    { ...body, requestId },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
  const endpoint = getWpGraphqlEndpoint();
  if (!endpoint) return respond({ message: "Cau hinh he thong chua day du." }, 500);
  const token = (await cookies()).get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) return respond({ message: "Ban can dang nhap de tiep tuc." }, 401);
  const result = await wpGetEmailVerificationStatus(endpoint, token);
  if (!result.ok) {
    logApiError(requestId, "/api/auth/email-verification", "email_verification_status_failed", { status: result.status });
    return respond({ message: result.message }, result.status);
  }
  return respond(result.data);
}

export async function emailVerificationResponse(request: Request, operation: "send" | "verify") {
  const requestId = createRequestId();
  const respond = (body: object, status = 200) => NextResponse.json(
    { ...body, requestId },
    { status, headers: { "Cache-Control": "private, no-store" } },
  );
  const endpoint = getWpGraphqlEndpoint();
  if (!endpoint) return respond({ message: "Cau hinh he thong chua day du." }, 500);
  if (!verifySameOriginCsrf(request)) return respond({ message: "Yeu cau khong hop le." }, 403);

  const token = (await cookies()).get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) return respond({ message: "Ban can dang nhap de tiep tuc." }, 401);

  const limit = enforceRateLimit({
    request,
    namespace: `auth_email_verification_${operation}`,
    max: operation === "send" ? 3 : 20,
    windowMs: 300_000,
  });
  if (!limit.ok) {
    const response = respond({
      message: "Ban thao tac qua nhanh. Vui long thu lai sau.",
      retryAfterSec: limit.retryAfterSec,
    }, 429);
    response.headers.set("Retry-After", String(limit.retryAfterSec));
    return response;
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return respond({ message: "Du lieu khong hop le." }, 400);
  }

  // Both schemas strip extra fields: identity comes only from the session cookie.
  const parsed = operation === "send"
    ? sendEmailVerificationSchema.safeParse(body)
    : verifyEmailSchema.safeParse(body);
  if (!parsed.success) {
    return respond({ message: parsed.error.issues[0]?.message || "Du lieu khong hop le." }, 400);
  }

  const result = "email" in parsed.data
    ? await wpSendEmailVerificationCode(endpoint, token, parsed.data)
    : await wpVerifyEmailCode(endpoint, token, parsed.data);
  if (!result.ok) {
    // Never log the submitted email, OTP, cookie or raw upstream response.
    logApiError(requestId, `/api/auth/email-verification/${operation}`, "email_verification_failed", { status: result.status });
    return respond({ message: result.message }, result.status);
  }
  return respond(result.data);
}
