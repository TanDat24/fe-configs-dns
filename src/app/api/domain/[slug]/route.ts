import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { toDomainConfig } from "@/lib/domain-parser";
import { wpGetDomainBySlug } from "@/lib/server/wp-domain";

export async function GET(
  _request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) {
    return NextResponse.json({ message: "Thieu WP_GRAPHQL_URL." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Chua dang nhap." }, { status: 401 });
  }

  const { slug } = await context.params;
  const result = await wpGetDomainBySlug(endpoint, token, slug);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  if (!result.domain) {
    return NextResponse.json({ message: "Khong tim thay ten mien." }, { status: 404 });
  }

  return NextResponse.json({ item: toDomainConfig(result.domain) });
}
