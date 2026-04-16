import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { wpGetSecurityPackages } from "@/lib/server/wp-domain";

export async function GET() {
  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) {
    return NextResponse.json({ message: "Thieu WP_GRAPHQL_URL." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Chua dang nhap." }, { status: 401 });
  }

  const result = await wpGetSecurityPackages(endpoint, token);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  const items = result.items.map((p) => ({
    id: p.id ?? 0,
    title: p.title ?? "",
    description: p.description ?? "",
  }));

  return NextResponse.json({ items });
}
