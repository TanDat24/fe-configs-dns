import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import { errorResponse, createRequestId } from "@/lib/server/request-security";

/**
 * Security fix: proxy authenticated CCCD images from private WP storage.
 * Direct public upload URLs are no longer used.
 */
export async function GET(request: Request) {
  const requestId = createRequestId();
  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) {
    return errorResponse("Cau hinh he thong chua day du.", 500, requestId);
  }

  const token = (await cookies()).get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return errorResponse("Ban can dang nhap de tiep tuc.", 401, requestId);
  }

  const side = new URL(request.url).searchParams.get("side");
  if (side !== "front" && side !== "back") {
    return errorResponse("Tham so khong hop le.", 400, requestId);
  }

  const wpBase = endpoint.replace(/\/graphql\/?$/i, "");
  const fileUrl = `${wpBase}/wp-json/config-dns/v1/cccd-file/${side}`;

  let upstream: Response;
  try {
    upstream = await fetch(fileUrl, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
  } catch {
    return errorResponse("Khong tai duoc anh CCCD.", 502, requestId);
  }

  if (!upstream.ok) {
    return errorResponse("Khong tai duoc anh CCCD.", upstream.status, requestId);
  }

  const bytes = await upstream.arrayBuffer();
  const contentType = upstream.headers.get("content-type") ?? "image/jpeg";

  return new NextResponse(bytes, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
