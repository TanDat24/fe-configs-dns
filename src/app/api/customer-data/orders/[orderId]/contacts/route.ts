import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { createRequestId, errorResponse, sanitizeApiMessage, verifySameOriginCsrf } from "@/lib/server/request-security";
import { wpGetOrderContactsV2, wpUpsertOrderContactV2 } from "@/lib/server/wp-customer-data";

function parseOrderId(raw: string): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

export async function GET(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) return NextResponse.json({ message: "Thieu WP_GRAPHQL_URL." }, { status: 500 });

  const token = (await cookies()).get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) return NextResponse.json({ message: "Chua dang nhap." }, { status: 401 });

  const { orderId: rawOrderId } = await context.params;
  const orderId = parseOrderId(rawOrderId);
  if (orderId <= 0) return NextResponse.json({ message: "orderId khong hop le." }, { status: 400 });

  const url = new URL(request.url);
  const limit = Number(url.searchParams.get("limit") ?? "200");
  const offset = Number(url.searchParams.get("offset") ?? "0");
  const result = await wpGetOrderContactsV2(endpoint, token, {
    orderId,
    limit: Number.isFinite(limit) ? limit : 200,
    offset: Number.isFinite(offset) ? offset : 0,
  });
  if (!result.ok) return NextResponse.json({ message: result.message }, { status: result.status });

  return NextResponse.json({ total: result.total, items: result.nodes });
}

export async function POST(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const requestId = createRequestId();
  if (!verifySameOriginCsrf(request)) return errorResponse("Yeu cau khong hop le.", 403, requestId);

  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) return errorResponse("Thieu WP_GRAPHQL_URL.", 500, requestId);

  const token = (await cookies()).get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) return errorResponse("Chua dang nhap.", 401, requestId);

  const { orderId: rawOrderId } = await context.params;
  const orderId = parseOrderId(rawOrderId);
  if (orderId <= 0) return errorResponse("orderId khong hop le.", 400, requestId);

  const body = (await request.json()) as Record<string, unknown>;
  const result = await wpUpsertOrderContactV2(endpoint, token, { ...body, order_id: orderId });
  if (!result.ok) return errorResponse(sanitizeApiMessage(result.status, result.message), result.status, requestId);

  return NextResponse.json({
    ok: true,
    code: result.code,
    message: result.message,
    id: result.id,
    requestId,
  });
}
