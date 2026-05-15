import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import {
  createRequestId,
  errorResponse,
  logApiError,
  sanitizeApiMessage,
  verifySameOriginCsrf,
} from "@/lib/server/request-security";
import { parseBodyOrThrow, saveUserContactSchema } from "@/lib/server/validators";
import { wpGetMyUserContactsV2, wpUpsertMyUserContactV2 } from "@/lib/server/wp-customer-data";

function parseOptionalPositiveInt(raw: string | null): number | undefined {
  if (raw === null || raw === "") {
    return undefined;
  }
  const value = Number(raw);
  return Number.isInteger(value) && value > 0 ? value : undefined;
}

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
  const contactType = url.searchParams.get("contactType") ?? undefined;
  const domainId = parseOptionalPositiveInt(url.searchParams.get("domainId"));
  const debug = url.searchParams.get("debug") === "1";
  const result = await wpGetMyUserContactsV2(endpoint, token, {
    contactType,
    ...(typeof domainId === "number" ? { domainId } : {}),
  });

  if (!result.ok) {
    return NextResponse.json(
      { message: result.message, ...(debug && result.debug ? { debug: result.debug } : {}) },
      { status: result.status },
    );
  }

  return NextResponse.json({ items: result.items });
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
    const body = (await request.json()) as unknown;
    const payload = parseBodyOrThrow(saveUserContactSchema, body);
    const result = await wpUpsertMyUserContactV2(endpoint, token, payload as Record<string, unknown>);
    if (!result.ok) {
      return errorResponse(sanitizeApiMessage(result.status, result.message), result.status, requestId);
    }

    return NextResponse.json({
      ok: true,
      code: result.code,
      message: result.message,
      id: result.id,
      requestId,
    });
  } catch (err) {
    logApiError(requestId, "/api/customer-data/user-contacts", err);
    return errorResponse(err instanceof Error ? err.message : "Du lieu khong hop le.", 400, requestId);
  }
}
