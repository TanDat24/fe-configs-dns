import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { wpGetMyUserInfoV2, wpUpsertMyUserInfoV2 } from "@/lib/server/wp-customer-data";
import { createRequestId, errorResponse, logApiError, sanitizeApiMessage, verifySameOriginCsrf } from "@/lib/server/request-security";

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

  const result = await wpGetMyUserInfoV2(endpoint, token);
  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  return NextResponse.json({ item: result.item });
}

export async function POST(request: Request) {
  const requestId = createRequestId();
  if (!verifySameOriginCsrf(request)) {
    return errorResponse("Yeu cau khong hop le.", 403, requestId);
  }

  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) {
    return errorResponse("Thieu WP_GRAPHQL_URL.", 500, requestId);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return errorResponse("Chua dang nhap.", 401, requestId);
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const result = await wpUpsertMyUserInfoV2(endpoint, token, body);
    if (!result.ok) {
      return errorResponse(sanitizeApiMessage(result.status, result.message), result.status, requestId);
    }
    return NextResponse.json({ ok: true, code: result.code, message: result.message, requestId });
  } catch (err) {
    logApiError(requestId, "/api/customer-data/my-user-info", err);
    return errorResponse("Du lieu khong hop le.", 400, requestId);
  }
}
