import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME, wpAuthCookieOptions } from "@/lib/auth-cookie";
import { getPublicOrigin } from "@/lib/server/public-origin";
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
  if (!appId || !secretKey) {
    console.error("[zalo callback] missing ZALO_APP_ID or ZALO_APP_SECRET");
    return null;
  }

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
    const raw = await res.text();
    if (!res.ok) {
      console.error("[zalo callback] access_token HTTP", res.status, raw);
      return null;
    }
    let data: ZaloTokenResponse;
    try {
      data = JSON.parse(raw) as ZaloTokenResponse;
    } catch {
      console.error("[zalo callback] access_token non-JSON:", raw);
      return null;
    }
    if (typeof data.access_token !== "string" || data.access_token.length === 0) {
      console.error("[zalo callback] access_token missing, body:", raw);
      return null;
    }
    return data.access_token;
  } catch (err) {
    console.error("[zalo callback] access_token exception:", err);
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
    const raw = await res.text();
    if (!res.ok) {
      console.error("[zalo callback] graph me HTTP", res.status, raw);
      return null;
    }
    let data: ZaloUserResponse;
    try {
      data = JSON.parse(raw) as ZaloUserResponse;
    } catch {
      console.error("[zalo callback] graph me non-JSON:", raw);
      return null;
    }
    if (!data || typeof data.id !== "string" || data.id.length === 0) {
      console.error("[zalo callback] graph me missing id, body:", raw);
      return null;
    }
    return {
      id: data.id,
      name: typeof data.name === "string" ? data.name : undefined,
      picture: data.picture?.data?.url,
    };
  } catch (err) {
    console.error("[zalo callback] graph me exception:", err);
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
  const origin = getPublicOrigin(request);
  const searchParams = new URL(request.url).searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const errorParam = searchParams.get("error") ?? searchParams.get("error_code");
  const errorDesc = searchParams.get("error_description") ?? searchParams.get("error_reason");
  const nextPath = parseNextFromState(state);

  const logoutWithError = (err: string) =>
    NextResponse.redirect(`${origin}/logout?error=${err}`);

  if (errorParam) {
    console.error("[zalo callback] zalo returned error:", errorParam, errorDesc);
    return logoutWithError(`zalo_${errorParam}`);
  }

  if (!code) {
    console.error("[zalo callback] missing code in callback");
    return logoutWithError("zalo_cancelled");
  }

  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) {
    console.error("[zalo callback] missing WP_GRAPHQL_URL");
    return logoutWithError("config");
  }

  const cookieStore = await cookies();
  const verifier = cookieStore.get(ZALO_PKCE_COOKIE)?.value;
  // Luon clear verifier cookie sau khi dung (one-shot)
  cookieStore.delete(ZALO_PKCE_COOKIE);

  if (!verifier) {
    console.error("[zalo callback] missing PKCE verifier cookie");
    return logoutWithError("zalo_pkce");
  }

  const accessToken = await exchangeCodeForAccessToken(code, verifier);
  if (!accessToken) return logoutWithError("zalo_token");

  const profile = await fetchZaloUser(accessToken);
  if (!profile) return logoutWithError("zalo_profile");

  const result = await wpLoginWithZalo(endpoint, {
    zaloId: profile.id,
    name: profile.name,
    picture: profile.picture,
  });
  if (!result.ok) {
    console.error("[zalo callback] wpLoginWithZalo failed:", result);
    return logoutWithError("zalo_login");
  }

  const fakeReq = { headers: { get: (h: string) => request.headers.get(h) } } as unknown as Request;
  cookieStore.set(
    WP_AUTH_COOKIE_NAME,
    result.authToken,
    wpAuthCookieOptions(AUTH_COOKIE_MAX_AGE_SEC, fakeReq),
  );

  return NextResponse.redirect(`${origin}${nextPath}`);
}
