import type { DomainConfig } from "@/lib/domain-types";

type DomainRaw = {
  id?: number | null;
  domain?: string | null;
  slug?: string | null;
  owner_name?: string | null;
  owner_address?: string | null;
  owner_phone?: string | null;
  owner_email?: string | null;
  owner_postcode?: string | null;
  registration_date?: string | null;
  expiry_date?: string | null;
  estimated_value?: string | null;
  domain_status?: string | null;
  protection_level?: string | null;
  profile_cccd_verified?: string | null;
  profile_declaration_verified?: string | null;
  profile_owner_verified?: string | null;
  profile_domain_verified?: string | null;
  redemption_days?: string | null;
  pending_delete_days?: string | null;
  dns_records_json?: string | null;
  name_servers_json?: string | null;
  child_dns_json?: string | null;
  email_forwards_json?: string | null;
  security_services_json?: string | null;
  two_factor_enabled?: string | null;
};

export function parseJsonArray<T>(raw: string | null | undefined): T[] {
  if (!raw) return [];
  try {
    const data = JSON.parse(raw) as unknown;
    return Array.isArray(data) ? (data as T[]) : [];
  } catch {
    return [];
  }
}

export function toDomainConfig(raw: DomainRaw): DomainConfig {
  return {
    id: raw.id ?? 0,
    domain: raw.domain ?? "",
    slug: raw.slug ?? "",
    owner_name: raw.owner_name ?? "",
    owner_address: raw.owner_address ?? "",
    owner_phone: raw.owner_phone ?? "",
    owner_email: raw.owner_email ?? "",
    owner_postcode: raw.owner_postcode ?? "",
    registration_date: raw.registration_date ?? "",
    expiry_date: raw.expiry_date ?? "",
    estimated_value: raw.estimated_value ?? "",
    domain_status: raw.domain_status ?? "",
    protection_level: raw.protection_level ?? "1",
    profile_cccd_verified: raw.profile_cccd_verified ?? "0",
    profile_declaration_verified: raw.profile_declaration_verified ?? "0",
    profile_owner_verified: raw.profile_owner_verified ?? "0",
    profile_domain_verified: raw.profile_domain_verified ?? "0",
    redemption_days: raw.redemption_days ?? "30",
    pending_delete_days: raw.pending_delete_days ?? "5",
    dns_records_json: parseJsonArray(raw.dns_records_json),
    name_servers_json: parseJsonArray(raw.name_servers_json),
    child_dns_json: parseJsonArray(raw.child_dns_json),
    email_forwards_json: parseJsonArray(raw.email_forwards_json),
    security_services_json: parseJsonArray(raw.security_services_json),
    two_factor_enabled: raw.two_factor_enabled ?? "0",
  };
}
