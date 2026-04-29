import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { wpGetProvincesV2 } from "@/lib/server/wp-customer-data";

export async function GET(request: Request) {
  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) {
    return NextResponse.json({ message: "Thieu WP_GRAPHQL_URL." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Chua dang nhap." }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "200");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const input = {
    type: url.searchParams.get("type") ?? undefined,
    parentId: url.searchParams.get("parentId") ? Number(url.searchParams.get("parentId")) : undefined,
    status: url.searchParams.get("status") ?? undefined,
    limit: Number.isFinite(limit) ? limit : 200,
    offset: Number.isFinite(offset) ? offset : 0,
  };

  const result = await wpGetProvincesV2(endpoint, token, input);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  return NextResponse.json({ total: result.total, items: result.nodes });
}
