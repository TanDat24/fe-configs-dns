import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { applyAuthSessionCookies, clearAuthSessionCookies, wpAuthCookieOptions } from "@/lib/auth-cookie";
import type { LoginDomainRequestDto, LoginDomainResponseDto } from "@/lib/contracts/api";
import { createRequestId, enforceRateLimit, logApiError, verifySameOriginCsrf } from "@/lib/server/request-security";
import { loginDomainSchema, parseBodyOrThrow } from "@/lib/server/validators";
import { wpAuthenticateDomain, wpStartDomainLoginOtp } from "@/lib/server/wp-domain-otp";

const FLOW_COOKIE = "domain_login_flow";
const FLOW_PATH = "/api/auth/login-domain";

export async function POST(request: Request) {
  const requestId = createRequestId();
  const respond = (body: object, status = 200) => NextResponse.json({ ...body, requestId }, {
    status, headers: { "Cache-Control": "private, no-store" },
  });
  const endpoint = process.env.WP_GRAPHQL_URL?.trim();
  if (!endpoint) return respond({ message: "Cau hinh he thong chua day du." }, 500);
  if (!verifySameOriginCsrf(request)) return respond({ message: "Yeu cau khong hop le." }, 403);
  const limit = enforceRateLimit({ request, namespace: "auth_login_domain", max: 10, windowMs: 60_000 });
  if (!limit.ok) {
    const response = respond({ message: "Ban thao tac qua nhanh. Vui long thu lai sau.", retryAfterSec: limit.retryAfterSec }, 429);
    response.headers.set("Retry-After", String(limit.retryAfterSec));
    return response;
  }
  let payload: LoginDomainRequestDto;
  try { payload = parseBodyOrThrow(loginDomainSchema, await request.json()); }
  catch { return respond({ message: "Du lieu dang nhap khong hop le." }, 400); }

  const cookieStore = await cookies();
  const existingFlow = cookieStore.get(FLOW_COOKIE)?.value;
  if (payload.action === "start") {
    const flow = existingFlow && /^[a-f0-9]{64}$/.test(existingFlow) ? existingFlow : randomBytes(32).toString("hex");
    const result = await wpStartDomainLoginOtp(endpoint, payload.domain, flow);
    if (!result.ok) {
      logApiError(requestId, "/api/auth/login-domain", "domain_otp_start_failed", { status: result.status });
      return respond({ message: result.message }, result.status);
    }
    const body: LoginDomainResponseDto = {
      ok: true, step: "otp", challengeId: result.data.challengeId,
      retryAfterSec: result.data.retryAfterSec, expiresInSec: result.data.expiresInSec,
      message: "Neu ten mien lien ket voi tai khoan co email da xac minh, ma dang nhap se duoc gui den email do.",
    };
    const response = respond(body);
    response.cookies.set(FLOW_COOKIE, flow, { ...wpAuthCookieOptions(300, request), path: FLOW_PATH });
    return response;
  }
  if (payload.action === "verify" && (!existingFlow || !/^[a-f0-9]{64}$/.test(existingFlow))) {
    return respond({ message: "Phien nhap ma da het han. Vui long gui lai ma." }, 401);
  }
  const result = await wpAuthenticateDomain(endpoint, payload.action === "verify"
    ? { ...payload, flow: existingFlow! } : payload);
  if (!result.ok) {
    logApiError(requestId, "/api/auth/login-domain", "domain_login_failed", { status: result.status });
    return respond({ message: result.message }, result.status);
  }
  const body: LoginDomainResponseDto = {
    ok: true, step: "authenticated", username: result.data.username, domain: result.data.domain,
  };
  const response = respond(body);
  // Replace both tokens so a missing new refresh token cannot retain another account's cookie.
  clearAuthSessionCookies(response, request);
  applyAuthSessionCookies(response, result.data, request);
  response.cookies.set(FLOW_COOKIE, "", { ...wpAuthCookieOptions(0, request), path: FLOW_PATH });
  return response;
}
