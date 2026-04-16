import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { wpGetDomainsList } from "@/lib/server/wp-domain";

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

  const result = await wpGetDomainsList(endpoint, token);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  const items = result.items.map((d) => ({ id: d.id ?? 0, domain: d.domain ?? "", slug: d.slug ?? "" }));
  return NextResponse.json({ items });
}
