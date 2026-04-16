import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { WP_AUTH_COOKIE_NAME } from "@/lib/auth-cookie";
import type { DomainJsonField, DomainOverviewField } from "@/lib/domain-types";
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
  const endpoint = process.env.WP_GRAPHQL_URL;
  if (!endpoint) {
    return NextResponse.json({ message: "Thieu WP_GRAPHQL_URL." }, { status: 500 });
  }

  const cookieStore = await cookies();
  const token = cookieStore.get(WP_AUTH_COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.json({ message: "Chua dang nhap." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ message: "Du lieu khong hop le." }, { status: 400 });
  }

  const domainId =
    typeof body === "object" &&
    body !== null &&
    "domainId" in body &&
    typeof (body as { domainId: unknown }).domainId === "number"
      ? (body as { domainId: number }).domainId
      : 0;

  const field =
    typeof body === "object" &&
    body !== null &&
    "field" in body &&
    typeof (body as { field: unknown }).field === "string"
      ? ((body as { field: string }).field as DomainJsonField | DomainOverviewField)
      : null;

  const payload =
    typeof body === "object" && body !== null && "payload" in body
      ? (body as { payload: unknown }).payload
      : null;

  if (!domainId || !field || !ALLOWED_FIELDS.includes(field)) {
    return NextResponse.json({ message: "Tham so khong hop le." }, { status: 400 });
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
    payloadJson = payload === "1" || payload === 1 || payload === true ? "1" : "0";
  } else if (JSON_FIELDS.includes(field)) {
    payloadJson = JSON.stringify(payload ?? []);
  } else {
    payloadJson = typeof payload === "string" ? payload : String(payload ?? "");
  }

  const result = await wpSaveDomainJsonTab(endpoint, token, {
    domainId,
    field,
    payloadJson,
  });

  if (!result.ok) {
    return NextResponse.json({ message: result.message }, { status: result.status });
  }

  return NextResponse.json({ message: result.message });
}
