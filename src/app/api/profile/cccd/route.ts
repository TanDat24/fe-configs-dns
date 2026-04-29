import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import type { UploadCccdResponseDto } from "@/lib/contracts/api";
import {
  createRequestId,
  enforceRateLimit,
  errorResponse,
  logApiError,
  sanitizeApiMessage,
  verifySameOriginCsrf,
} from "@/lib/server/request-security";
import { wpUploadMyCccd } from "@/lib/server/wp-cccd";

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const requestId = createRequestId();
  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) {
    return errorResponse("Cau hinh he thong chua day du.", 500, requestId);
  }

  if (!verifySameOriginCsrf(request)) {
    return errorResponse("Yeu cau khong hop le.", 403, requestId);
  }

  const limit = enforceRateLimit({
    request,
    namespace: "profile_upload_cccd",
    max: 10,
    windowMs: 60_000,
  });
  if (!limit.ok) {
    return NextResponse.json(
      {
        message: "Ban thao tac qua nhanh. Vui long thu lai sau.",
        requestId,
        retryAfterSec: limit.retryAfterSec,
      },
      { status: 429 },
    );
  }

  const token = (await cookies()).get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return errorResponse("Ban can dang nhap de tiep tuc.", 401, requestId);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorResponse("Du lieu tai len khong hop le.", 400, requestId);
  }

  const frontFile = form.get("frontFile");
  const backFile = form.get("backFile");
  if (!(frontFile instanceof File) || !(backFile instanceof File)) {
    return errorResponse("Vui long tai day du mat truoc va mat sau CCCD.", 400, requestId);
  }

  const validateFile = (file: File, label: string): string | null => {
    if (!ALLOWED_MIME.has(file.type)) return `${label}: chi ho tro JPG, PNG hoac WEBP.`;
    if (file.size <= 0 || file.size > MAX_UPLOAD_BYTES) return `${label}: kich thuoc phai nho hon 5MB.`;
    return null;
  };
  const frontErr = validateFile(frontFile, "Mat truoc");
  if (frontErr) return errorResponse(frontErr, 400, requestId);
  const backErr = validateFile(backFile, "Mat sau");
  if (backErr) return errorResponse(backErr, 400, requestId);

  const toUploadPayload = async (file: File, side: "front" | "back") => {
    const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const safeName = (file.name || `cccd-${side}.${ext}`).replace(/[^a-zA-Z0-9._-]/g, "_");
    const bytes = await file.arrayBuffer();
    const contentBase64 = Buffer.from(bytes).toString("base64");
    return { fileName: safeName, mimeType: file.type, contentBase64, side };
  };

  const frontPayload = await toUploadPayload(frontFile, "front");
  const backPayload = await toUploadPayload(backFile, "back");

  const frontResult = await wpUploadMyCccd(endpoint, token, frontPayload);
  if (!frontResult.ok) {
    logApiError(requestId, "/api/profile/cccd", frontResult.message, { status: frontResult.status, side: "front" });
    return errorResponse(sanitizeApiMessage(frontResult.status, frontResult.message), frontResult.status, requestId);
  }

  const backResult = await wpUploadMyCccd(endpoint, token, backPayload);
  if (!backResult.ok) {
    logApiError(requestId, "/api/profile/cccd", backResult.message, { status: backResult.status, side: "back" });
    return errorResponse(sanitizeApiMessage(backResult.status, backResult.message), backResult.status, requestId);
  }

  const responseBody: UploadCccdResponseDto = {
    message: "Da tai len day du mat truoc va mat sau CCCD.",
    frontFileUrl: frontResult.fileUrl,
    backFileUrl: backResult.fileUrl,
  };
  return NextResponse.json(responseBody);
}

