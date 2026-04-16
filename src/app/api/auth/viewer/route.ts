import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { wpGraphqlViewer } from "@/lib/server/wp-viewer";

export async function GET() {
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

  const cookieStore = await cookies();
  const token = cookieStore.get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Chưa đăng nhập." }, { status: 401 });
  }

  const result = await wpGraphqlViewer(endpoint, token);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  return NextResponse.json({ viewer: result.viewer });
}
