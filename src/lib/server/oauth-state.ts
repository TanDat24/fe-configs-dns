import crypto from "node:crypto";
import { cookies } from "next/headers";

type OAuthProvider = "google" | "zalo";

const SESSION_COOKIE = "oauth_session";
const STATE_TTL_SEC = 60 * 10;

type OAuthStatePayload = {
  provider: OAuthProvider;
  next: string;
  consent: boolean;
  nonce: string;
  sid: string;
  exp: number;
};

function randomToken(length = 32): string {
  return crypto.randomBytes(length).toString("base64url");
}

function normalizeNextPath(raw: string | null | undefined): string {
  const next = (raw ?? "/").trim();
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/";
  return next;
}

function getStateSecret(): string | null {
  const secret =
    process.env.OAUTH_STATE_HMAC_SECRET ??
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    process.env.GOOGLE_CLIENT_SECRET ??
    process.env.ZALO_APP_SECRET ??
    "";
  return secret.trim() === "" ? null : secret;
}

async function getOrCreateSessionId(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(SESSION_COOKIE)?.value;
  if (typeof existing === "string" && existing.length >= 16) return existing;

  const sid = randomToken(24);
  cookieStore.set(SESSION_COOKIE, sid, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return sid;
}

function signPayload(payloadBase64: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payloadBase64).digest("base64url");
}

export async function createSignedOAuthState(input: {
  provider: OAuthProvider;
  nextRaw: string | null;
  consent: boolean;
}): Promise<{ state: string; nonce: string; nextPath: string; stateTtlSec: number }> {
  const sid = await getOrCreateSessionId();
  const nonce = randomToken(18);
  const nextPath = normalizeNextPath(input.nextRaw);
  const payload: OAuthStatePayload = {
    provider: input.provider,
    next: nextPath,
    consent: input.consent,
    nonce,
    sid,
    exp: Math.floor(Date.now() / 1000) + STATE_TTL_SEC,
  };
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const secret = getStateSecret();
  const signature = secret ? signPayload(payloadBase64, secret) : "";
  return { state: `${payloadBase64}.${signature}`, nonce, nextPath, stateTtlSec: STATE_TTL_SEC };
}

export async function verifySignedOAuthState(
  state: string | null,
  expectedProvider: OAuthProvider,
): Promise<{ ok: true; nextPath: string; consent: boolean; nonce: string } | { ok: false }> {
  if (!state) return { ok: false };
  const [payloadBase64, signature] = state.split(".", 2);
  if (!payloadBase64 || !signature) return { ok: false };

  const secret = getStateSecret();
  if (!secret) return { ok: false };
  const expectedSig = signPayload(payloadBase64, secret);
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) return { ok: false };

  try {
    const payload = JSON.parse(Buffer.from(payloadBase64, "base64url").toString()) as OAuthStatePayload;
    if (payload.provider !== expectedProvider) return { ok: false };
    if (!payload.nonce || typeof payload.nonce !== "string") return { ok: false };
    if (typeof payload.exp !== "number" || payload.exp < Math.floor(Date.now() / 1000)) return { ok: false };
    const sessionId = (await cookies()).get(SESSION_COOKIE)?.value ?? "";
    if (!payload.sid || payload.sid !== sessionId) return { ok: false };
    return { ok: true, nextPath: normalizeNextPath(payload.next), consent: payload.consent === true, nonce: payload.nonce };
  } catch {
    return { ok: false };
  }
}
