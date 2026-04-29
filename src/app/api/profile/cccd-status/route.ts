import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { createRequestId, errorResponse, sanitizeApiMessage } from "@/lib/server/request-security";
import { wpGetMyCccdReviewStatus } from "@/lib/server/wp-cccd";

export async function GET() {
  const requestId = createRequestId();
  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) {
    return errorResponse("Cau hinh he thong chua day du.", 500, requestId);
  }

  const token = (await cookies()).get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return errorResponse("Ban can dang nhap de tiep tuc.", 401, requestId);
  }

  const result = await wpGetMyCccdReviewStatus(endpoint, token);
  if (!result.ok) {
    return errorResponse(sanitizeApiMessage(result.status, result.message), result.status, requestId);
  }

  return NextResponse.json({
    status: result.status,
    canUpload: result.canUpload,
    message: result.message,
  });
}

