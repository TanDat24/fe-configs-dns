import { NextResponse } from "next/server";
import { createRequestId } from "@/lib/server/request-security";
import { getPublicOrigin } from "@/lib/server/public-origin";
import { createSignedOAuthState } from "@/lib/server/oauth-state";

export async function GET(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    const requestId = createRequestId();
    return NextResponse.json(
      { message: "Dang nhap Google chua duoc cau hinh tren may chu.", requestId },
      { status: 501 },
    );
  }

  const origin = getPublicOrigin(request);
  const redirectUri = `${origin}/api/auth/google/callback`;

  const next = new URL(request.url).searchParams.get("next");
  const consent = new URL(request.url).searchParams.get("consent") === "1";
  const { state, nonce } = await createSignedOAuthState({ provider: "google", nextRaw: next, consent });

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
    nonce,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
}
