import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME, wpAuthCookieOptions } from "@/lib/auth-cookie";

export async function POST(request: Request) {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(WP_AUTH_COOKIE_NAME, "", wpAuthCookieOptions(0, request));
  return res;
}
