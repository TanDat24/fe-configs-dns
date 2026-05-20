import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import {
  createRequestId,
  enforceRateLimit,
  errorResponse,
  logApiError,
  sanitizeApiMessage,
  verifySameOriginCsrf,
} from "@/lib/server/request-security";
import { linkDomainSchema, parseBodyOrThrow } from "@/lib/server/validators";
import { wpLinkDomainToCurrentUser } from "@/lib/server/wp-domain";

export async function POST(request: Request) {
  const requestId = createRequestId();
  if (!verifySameOriginCsrf(request)) {
    return errorResponse("Yeu cau khong hop le.", 403, requestId);
  }

  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) {
    return errorResponse("Thieu WP_GRAPHQL_URL.", 500, requestId);
  }

  const limit = enforceRateLimit({
    request,
    namespace: "domain_link",
    max: 10,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      { message: "Ban thao tac qua nhanh. Vui long thu lai sau.", requestId, retryAfterSec: limit.retryAfterSec },
      { status: 429 },
    );
  }

  const token = (await cookies()).get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return errorResponse("Chua dang nhap.", 401, requestId);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Du lieu khong hop le.", 400, requestId);
  }

  let payload: { domain: string; force?: boolean };
  try {
    payload = parseBodyOrThrow(linkDomainSchema, body);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Du lieu khong hop le.", 400, requestId);
  }

  const result = await wpLinkDomainToCurrentUser(endpoint, token, payload);
  if (!result.ok) {
    logApiError(requestId, "/api/domain/link", result.message, { status: result.status, code: result.code });
    return errorResponse(sanitizeApiMessage(result.status, result.message), result.status, requestId);
  }

  return NextResponse.json({
    ok: true,
    code: result.code,
    message: result.message,
    domainId: result.domainId,
    domain: result.domain,
    slug: result.slug,
    requestId,
  });
}
