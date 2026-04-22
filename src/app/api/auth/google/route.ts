import { NextResponse } from "next/server";
import { createRequestId } from "@/lib/server/request-security";
import { getPublicOrigin } from "@/lib/server/public-origin";

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

  const next = new URL(request.url).searchParams.get("next") ?? "/";
  const state = Buffer.from(JSON.stringify({ next })).toString("base64url");

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });

  return NextResponse.redirect(
    `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
  );
}
