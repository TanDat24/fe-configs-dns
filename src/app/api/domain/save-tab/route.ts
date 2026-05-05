import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import type { DomainJsonField, DomainOverviewField } from "@/lib/domain-types";
import type { SaveDomainTabRequestDto, SaveDomainTabResponseDto } from "@/lib/contracts/api";
import {
  createRequestId,
  errorResponse,
  logApiError,
  sanitizeApiMessage,
  verifySameOriginCsrf,
} from "@/lib/server/request-security";
import { parseBodyOrThrow, saveDomainTabSchema } from "@/lib/server/validators";
import { wpSaveDomainJsonTab } from "@/lib/server/wp-domain";

const ALLOWED_FIELDS: Array<DomainJsonField | DomainOverviewField> = [
  "dns_records_json",
  "name_servers_json",
  "child_dns_json",
  "email_forwards_json",
  "security_services_json",
  "two_factor_enabled",
  "owner_name",
  "owner_address",
  "owner_phone",
  "owner_email",
  "owner_postcode",
  "registration_date",
  "expiry_date",
  "estimated_value",
  "domain_status",
  "protection_level",
  "profile_cccd_verified",
  "profile_declaration_verified",
  "profile_owner_verified",
  "profile_domain_verified",
  "redemption_days",
  "pending_delete_days",
];

export async function POST(request: Request) {
  const requestId = createRequestId();
  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) {
    return errorResponse("Cau hinh he thong chua day du.", 500, requestId);
  }

  if (!verifySameOriginCsrf(request)) {
    return errorResponse("Yeu cau khong hop le.", 403, requestId);
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return errorResponse("Ban can dang nhap de tiep tuc.", 401, requestId);
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorResponse("Du lieu khong hop le.", 400, requestId);
  }

  let payloadDto: SaveDomainTabRequestDto;
  try {
    payloadDto = parseBodyOrThrow(saveDomainTabSchema, body);
  } catch (err) {
    return errorResponse(err instanceof Error ? err.message : "Tham so khong hop le.", 400, requestId);
  }

  const field = payloadDto.field as DomainJsonField | DomainOverviewField;
  if (!ALLOWED_FIELDS.includes(field)) {
    return errorResponse("Tham so khong hop le.", 400, requestId);
  }

  const JSON_FIELDS: string[] = [
    "dns_records_json",
    "name_servers_json",
    "child_dns_json",
    "email_forwards_json",
    "security_services_json",
  ];

  let payloadJson: string;
  if (field === "two_factor_enabled") {
    payloadJson =
      payloadDto.payload === "1" || payloadDto.payload === 1 || payloadDto.payload === true ? "1" : "0";
  } else if (JSON_FIELDS.includes(field)) {
    payloadJson = JSON.stringify(payloadDto.payload ?? []);
  } else {
    payloadJson =
      typeof payloadDto.payload === "string" ? payloadDto.payload : String(payloadDto.payload ?? "");
  }

  const result = await wpSaveDomainJsonTab(endpoint, token, {
    domainId: payloadDto.domainId,
    field,
    payloadJson,
  });

  if (!result.ok) {
    logApiError(requestId, "/api/domain/save-tab", result.message, { status: result.status, field });
    const message = result.status === 400 ? result.message : sanitizeApiMessage(result.status, "Khong the luu du lieu.");
    return errorResponse(message, result.status, requestId);
  }

  const responseBody: SaveDomainTabResponseDto = { message: result.message };
  return NextResponse.json(responseBody);
}
