import { NextResponse } from "next/server";
import { clearAuthSessionCookies } from "@/lib/auth-cookie";

export async function POST(request: Request) {
  const res = NextResponse.json({ ok: true });
  clearAuthSessionCookies(res, request);
  return res;
}
