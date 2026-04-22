import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME, wpAuthCookieOptions } from "@/lib/auth-cookie";
import { wpLoginWithZalo } from "@/lib/server/wp-register";
import { ZALO_PKCE_COOKIE } from "../route";

const AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

type ZaloTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: string | number;
  error?: unknown;
  error_name?: unknown;
  error_reason?: unknown;
};

type ZaloUserResponse = {
  id?: string;
  name?: string;
  error?: unknown;
  picture?: {
    data?: { url?: string };
  };
};

async function exchangeCodeForAccessToken(
  code: string,
  verifier: string,
): Promise<string | null> {
  const appId = process.env.ZALO_APP_ID;
  const secretKey = process.env.ZALO_APP_SECRET;
  if (!appId || !secretKey) return null;

  try {
    const res = await fetch("https://oauth.zaloapp.com/v4/access_token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        secret_key: secretKey,
      },
      body: new URLSearchParams({
        code,
        app_id: appId,
        grant_type: "authorization_code",
        code_verifier: verifier,
      }).toString(),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ZaloTokenResponse;
    return typeof data.access_token === "string" ? data.access_token : null;
  } catch {
    return null;
  }
}

async function fetchZaloUser(
  accessToken: string,
): Promise<{ id: string; name?: string; picture?: string } | null> {
  try {
    const url = new URL("https://graph.zalo.me/v2.0/me");
    url.searchParams.set("fields", "id,name,picture");
    const res = await fetch(url.toString(), {
      headers: { access_token: accessToken },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as ZaloUserResponse;
    if (!data || typeof data.id !== "string") return null;
    return {
      id: data.id,
      name: typeof data.name === "string" ? data.name : undefined,
      picture: data.picture?.data?.url,
    };
  } catch {
    return null;
  }
}

function parseNextFromState(state: string | null): string {
  if (!state) return "/";
  try {
    const parsed = JSON.parse(Buffer.from(state, "base64url").toString()) as {
      next?: string;
    };
    const next = (parsed.next ?? "/").trim();
    if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
    return next;
  } catch {
    return "/";
  }
}

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const nextPath = parseNextFromState(state);

  const logoutWithError = (err: string) =>
    NextResponse.redirect(`${origin}/logout?error=${err}`);

  if (!code) return logoutWithError("zalo_cancelled");

  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) return logoutWithError("config");

  const cookieStore = await cookies();
  const verifier = cookieStore.get(ZALO_PKCE_COOKIE)?.value;
  // Luon clear verifier cookie sau khi dung (one-shot)
  cookieStore.delete(ZALO_PKCE_COOKIE);

  if (!verifier) return logoutWithError("zalo_token");

  const accessToken = await exchangeCodeForAccessToken(code, verifier);
  if (!accessToken) return logoutWithError("zalo_token");

  const profile = await fetchZaloUser(accessToken);
  if (!profile) return logoutWithError("zalo_token");

  const result = await wpLoginWithZalo(endpoint, {
    zaloId: profile.id,
    name: profile.name,
    picture: profile.picture,
  });
  if (!result.ok) return logoutWithError("zalo_login");

  const fakeReq = { headers: { get: (h: string) => request.headers.get(h) } } as unknown as Request;
  cookieStore.set(
    WP_AUTH_COOKIE_NAME,
    result.authToken,
    wpAuthCookieOptions(AUTH_COOKIE_MAX_AGE_SEC, fakeReq),
  );

  return NextResponse.redirect(`${origin}${nextPath}`);
}
