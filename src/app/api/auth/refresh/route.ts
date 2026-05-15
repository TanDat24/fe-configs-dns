import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  applyAuthSessionCookies,
  clearAuthSessionCookies,
  WP_REFRESH_COOKIE_NAME,
} from "@/lib/auth-cookie";
import { wpGraphqlRefreshAuthToken } from "@/lib/server/wp-login";

function safeNextPath(raw: string | null): string {
  const next = (raw ?? "/dashboard").trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) {
    return "/dashboard";
  }
  return next;
}

/** GET: middleware redirect — đổi refresh → auth cookie rồi quay lại app. */
export async function GET(request: Request) {
  const endpoint = process.env.WP_GRAPHQL_URL;
  const url = new URL(request.url);
  const nextPath = safeNextPath(url.searchParams.get("next"));

  if (!endpoint) {
    return NextResponse.redirect(new URL("/logout", request.url));
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(WP_REFRESH_COOKIE_NAME)?.value ?? "";

  if (refreshToken === "") {
    const res = NextResponse.redirect(new URL("/logout", request.url));
    clearAuthSessionCookies(res, request);
    return res;
  }

  const result = await wpGraphqlRefreshAuthToken(endpoint, refreshToken);
  if (!result.ok) {
    const res = NextResponse.redirect(new URL("/logout", request.url));
    clearAuthSessionCookies(res, request);
    return res;
  }

  const res = NextResponse.redirect(new URL(nextPath, request.url));
  applyAuthSessionCookies(res, { authToken: result.authToken, refreshToken }, request);
  return res;
}

/** POST: rotate token (API / client). */
export async function POST(request: Request) {
  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) {
    return NextResponse.json({ message: "Thieu WP_GRAPHQL_URL." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const refreshToken = cookieStore.get(WP_REFRESH_COOKIE_NAME)?.value ?? "";

  if (refreshToken === "") {
    return NextResponse.json({ message: "Chua dang nhap." }, { status: 401 });
  }

  const result = await wpGraphqlRefreshAuthToken(endpoint, refreshToken);
  if (!result.ok) {
    const res = NextResponse.json({ message: result.message }, { status: result.status });
    clearAuthSessionCookies(res, request);
    return res;
  }

  const res = NextResponse.json({ ok: true, authToken: result.authToken });
  applyAuthSessionCookies(res, { authToken: result.authToken, refreshToken }, request);
  return res;
}
