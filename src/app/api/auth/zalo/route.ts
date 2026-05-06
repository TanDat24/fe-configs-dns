import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { getPublicOrigin } from "@/lib/server/public-origin";
import { createSignedOAuthState } from "@/lib/server/oauth-state";

export const ZALO_PKCE_COOKIE = "zalo_pkce";
export const ZALO_NONCE_COOKIE = "zalo_nonce";

function randomVerifier(length = 64): string {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}

function pkceChallenge(verifier: string): string {
  return crypto.createHash("sha256").update(verifier).digest("base64url");
}

export async function GET(request: Request) {
  const origin = getPublicOrigin(request);
  const searchParams = new URL(request.url).searchParams;
  const next = searchParams.get("next");
  const consent = searchParams.get("consent") === "1";

  const appId = process.env.ZALO_APP_ID;
  if (!appId) {
    const back = new URL("/logout", origin);
    back.searchParams.set("error", "zalo_config");
    if (next && next !== "/") back.searchParams.set("next", next);
    return NextResponse.redirect(back);
  }

  const redirectUri = `${origin}/api/auth/zalo/callback`;

  const verifier = randomVerifier();
  const challenge = pkceChallenge(verifier);
  const { state, nonce, stateTtlSec } = await createSignedOAuthState({
    provider: "zalo",
    nextRaw: next,
    consent,
  });

  const params = new URLSearchParams({
    app_id: appId,
    redirect_uri: redirectUri,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  // Luu code_verifier trong cookie tam (httpOnly, 10 phut) de callback doc lai
  const cookieStore = await cookies();
  cookieStore.set(ZALO_PKCE_COOKIE, verifier, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/api/auth/zalo/",
    maxAge: 60 * 10,
  });
  cookieStore.set(ZALO_NONCE_COOKIE, nonce, {
    httpOnly: true,
    sameSite: "lax",
    secure: origin.startsWith("https://"),
    path: "/api/auth/zalo/",
    maxAge: stateTtlSec,
  });

  return NextResponse.redirect(
    `https://oauth.zaloapp.com/v4/permission?${params.toString()}`,
  );
}
