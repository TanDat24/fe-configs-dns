import { NextResponse } from "next/server";
import type {
  ForgotPasswordDomainRequestDto,
  ForgotPasswordDomainResponseDto,
} from "@/lib/contracts/api";
import {
  createRequestId,
  enforceRateLimit,
  errorResponse,
  logApiError,
  verifySameOriginCsrf,
} from "@/lib/server/request-security";
import {
  forgotPasswordDomainSchema,
  parseBodyOrThrow,
} from "@/lib/server/validators";
import { wpGraphqlForgotPassword } from "@/lib/server/wp-forgot-password";
import {
  wpCheckDomainEmailMatch,
  wpCheckDomainExists,
} from "@/lib/server/wp-login-domain";

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
    namespace: "auth_forgot_password_domain",
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

  let payload: ForgotPasswordDomainRequestDto;
  try {
    payload = parseBodyOrThrow(forgotPasswordDomainSchema, body);
  } catch (err) {
    return errorResponse(
      err instanceof Error ? err.message : "Du lieu khong hop le.",
      400,
      requestId,
    );
  }

  const neutralResponse: ForgotPasswordDomainResponseDto = {
    domain: payload.domain,
    email: payload.email,
    message:
      "Yêu cầu đã được gửi. Vui lòng kiểm tra email.",
  };

  const matchResult = await wpCheckDomainEmailMatch(endpoint, payload.domain, payload.email);
  if (!matchResult.ok) {
    logApiError(requestId, "/api/auth/forgot-password-domain", matchResult.message, {
      status: matchResult.status,
    });
    // Fallback tam thoi: neu backend khong cho check mapping domain-email,
    // van cho gui reset khi ten mien ton tai de khong chan luong khoi phuc.
    const domainResult = await wpCheckDomainExists(endpoint, payload.domain);
    if (!domainResult.ok) {
      logApiError(requestId, "/api/auth/forgot-password-domain", domainResult.message, {
        status: domainResult.status,
      });
      return NextResponse.json(neutralResponse);
    }
    if (!domainResult.domainExists) {
      return NextResponse.json(neutralResponse);
    }

    const forgotFallback = await wpGraphqlForgotPassword(endpoint, payload.email);
    if (!forgotFallback.ok) {
      logApiError(requestId, "/api/auth/forgot-password-domain", forgotFallback.message, {
        status: forgotFallback.status,
      });
    }
    return NextResponse.json(neutralResponse);
  }
  if (!matchResult.matched) {
    return NextResponse.json(neutralResponse);
  }

  const forgotResult = await wpGraphqlForgotPassword(endpoint, payload.email);
  if (!forgotResult.ok) {
    logApiError(requestId, "/api/auth/forgot-password-domain", forgotResult.message, {
      status: forgotResult.status,
    });
    return NextResponse.json(neutralResponse);
  }

  return NextResponse.json(neutralResponse);
}
