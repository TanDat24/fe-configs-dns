import { cookies } from "next/headers";
import { createRequestId, errorResponse, sanitizeApiMessage, verifySameOriginCsrf } from "@/lib/server/request-security";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { wpDeleteOrderContactV2 } from "@/lib/server/wp-customer-data";

function parseId(raw: string): number {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : 0;
}

export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const requestId = createRequestId();
  if (!verifySameOriginCsrf(request)) return errorResponse("Yeu cau khong hop le.", 403, requestId);

  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) return errorResponse("Thieu WP_GRAPHQL_URL.", 500, requestId);

  const token = (await cookies()).get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) return errorResponse("Chua dang nhap.", 401, requestId);

  const { id: rawId } = await context.params;
  const id = parseId(rawId);
  if (id <= 0) return errorResponse("id khong hop le.", 400, requestId);

  const result = await wpDeleteOrderContactV2(endpoint, token, id);
  if (!result.ok) return errorResponse(sanitizeApiMessage(result.status, result.message), result.status, requestId);

  return NextResponse.json({ ok: true, code: result.code, message: result.message, requestId });
}
