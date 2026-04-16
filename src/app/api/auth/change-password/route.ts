import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { wpGraphqlChangePassword } from "@/lib/server/wp-change-password";

export async function POST(request: Request) {
  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) {
    return NextResponse.json({ message: "Thieu WP_GRAPHQL_URL." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Chua dang nhap." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Du lieu khong hop le." }, { status: 400 });
  }

  const oldPassword = typeof body === "object" && body !== null && "oldPassword" in body && typeof (body as { oldPassword: unknown }).oldPassword === "string"
    ? (body as { oldPassword: string }).oldPassword
    : "";
  const newPassword = typeof body === "object" && body !== null && "newPassword" in body && typeof (body as { newPassword: unknown }).newPassword === "string"
    ? (body as { newPassword: string }).newPassword
    : "";
  const confirmPassword = typeof body === "object" && body !== null && "confirmPassword" in body && typeof (body as { confirmPassword: unknown }).confirmPassword === "string"
    ? (body as { confirmPassword: string }).confirmPassword
    : "";

  const result = await wpGraphqlChangePassword(endpoint, token, {
    oldPassword,
    newPassword,
    confirmPassword,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  return NextResponse.json({ message: result.message });
}
