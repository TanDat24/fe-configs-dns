import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME, wpAuthCookieOptions } from "@/lib/auth-cookie";
import { getPublicOrigin } from "@/lib/server/public-origin";
import { wpLoginWithGoogle, wpSocialAccountExists } from "@/lib/server/wp-register";
import { verifySignedOAuthState } from "@/lib/server/oauth-state";

const AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

async function exchangeCodeForIdToken(
  code: string,
  redirectUri: string,
): Promise<string | null> {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as Record<string, unknown>;
    return typeof data.id_token === "string" ? data.id_token : null;
  } catch {
    return null;
  }
}

function decodeJwtPayload(idToken: string): Record<string, unknown> | null {
  try {
    const parts = idToken.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(Buffer.from(parts[1], "base64url").toString()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const origin = getPublicOrigin(request);
  const sp = new URL(request.url).searchParams;
  const code = sp.get("code");
  const state = sp.get("state");
  const logoutWithError = (err: string) =>
    NextResponse.redirect(`${origin}/logout?error=${err}`);

  if (!code) return logoutWithError("google_cancelled");

  const verifiedState = await verifySignedOAuthState(state, "google");
  if (!verifiedState.ok) return logoutWithError("google_state");
  const nextPath = verifiedState.nextPath;

  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) return logoutWithError("config");

  const redirectUri = `${origin}/api/auth/google/callback`;
  const idToken = await exchangeCodeForIdToken(code, redirectUri);
  if (!idToken) return logoutWithError("google_token");

  const payload = decodeJwtPayload(idToken);
  const nonce = typeof payload?.nonce === "string" ? payload.nonce : "";
  if (!nonce || nonce !== verifiedState.nonce) return logoutWithError("google_nonce");

  const email = typeof payload?.email === "string" ? payload.email : "";
  if (email !== "") {
    const exists = await wpSocialAccountExists(endpoint, { provider: "google", email });
    if ((!exists.ok || !exists.exists) && !verifiedState.consent) {
      const back = new URL("/logout", origin);
      back.searchParams.set("error", "consent_required_google");
      back.searchParams.set("consent_provider", "google");
      if (nextPath !== "/") back.searchParams.set("next", nextPath);
      return NextResponse.redirect(back);
    }
  }

  const result = await wpLoginWithGoogle(endpoint, idToken);
  if (!result.ok) return logoutWithError("google_login");

  const cookieStore = await cookies();
  const fakeReq = { headers: { get: (h: string) => request.headers.get(h) } } as unknown as Request;
  cookieStore.set(WP_AUTH_COOKIE_NAME, result.authToken, wpAuthCookieOptions(AUTH_COOKIE_MAX_AGE_SEC, fakeReq));

  return NextResponse.redirect(`${origin}${nextPath}`);
}
