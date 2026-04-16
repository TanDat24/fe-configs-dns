import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME, wpAuthCookieOptions } from "@/lib/auth-cookie";
import { wpGraphqlLogin } from "@/lib/server/wp-login";

const AUTH_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 7;

export async function POST(request: Request) {
  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) {
    return NextResponse.json(
      {
        message:
          "Thiếu biến môi trường WP_GRAPHQL_URL (URL endpoint GraphQL của WordPress).",
      },
      { status: 500 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Dữ liệu không hợp lệ." }, { status: 400 });
  }

  const username =
    typeof body === "object" &&
    body !== null &&
    "username" in body &&
    typeof (body as { username: unknown }).username === "string"
      ? (body as { username: string }).username.trim()
      : "";
  const password =
    typeof body === "object" &&
    body !== null &&
    "password" in body &&
    typeof (body as { password: unknown }).password === "string"
      ? (body as { password: string }).password
      : "";

  if (!username || !password) {
    return NextResponse.json(
      { message: "Vui lòng nhập tên người dùng và mật khẩu." },
      { status: 400 },
    );
  }

  const result = await wpGraphqlLogin(endpoint, username, password);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  const res = NextResponse.json({ authToken: result.authToken });
  res.cookies.set(
    WP_AUTH_COOKIE_NAME,
    result.authToken,
    wpAuthCookieOptions(AUTH_COOKIE_MAX_AGE_SEC, request),
  );
  return res;
}
