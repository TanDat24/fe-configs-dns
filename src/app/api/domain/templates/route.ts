import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { wpGetDnsTemplates } from "@/lib/server/wp-domain";

function parseRecords(raw: string | null | undefined) {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

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

  const result = await wpGetDnsTemplates(endpoint, token);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  const items = result.items.map((t) => ({
    id: t.id ?? 0,
    title: t.title ?? "Mau DNS",
    records: parseRecords(t.records_json),
  }));

  return NextResponse.json({ items });
}
