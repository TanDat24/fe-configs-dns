import { NextResponse } from "next/server";
import { wpGraphqlForgotPassword } from "@/lib/server/wp-forgot-password";

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

  const email =
    typeof body === "object" &&
    body !== null &&
    "email" in body &&
    typeof (body as { email: unknown }).email === "string"
      ? (body as { email: string }).email.trim()
      : "";

  if (!email) {
    return NextResponse.json(
      { message: "Vui lòng nhập email hoặc tên người dùng." },
      { status: 400 },
    );
  }

  const result = await wpGraphqlForgotPassword(endpoint, email);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  return NextResponse.json({
    message: result.message,
    clientMutationId: result.clientMutationId ?? undefined,
  });
}
