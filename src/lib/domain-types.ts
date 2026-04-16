export type DnsRecord = {
  host: string;
  type: string;
  value: string;
  ttl: string;
  priority: string;
};

export type DnsTemplate = {
  id: number;
  title: string;
  records: DnsRecord[];
};

export type ChildDnsRow = {
  name: string;
  ipv4: string;
  ipv6: string;
};

export type EmailForwardRow = {
  source: string;
  target: string;
};

export type SecurityService = {
  id: string;
  title: string;
  description: string;
  enabled: boolean;
};

export type SecurityPackage = {
  id: number;
  title: string;
  description: string;
};

export function computeProtectionLevel(
  services: SecurityService[],
  twoFactorEnabled: boolean,
): number {
  const enabledCount = services.filter((s) => s.enabled).length;
  return Math.min(5, enabledCount + (twoFactorEnabled ? 1 : 0));
}

export type DomainConfig = {
  id: number;
  domain: string;
  slug: string;
  owner_name: string;
  owner_address: string;
  owner_phone: string;
  owner_email: string;
  owner_postcode: string;
  registration_date: string;
  expiry_date: string;
  estimated_value: string;
  domain_status: string;
  protection_level: string;
  profile_cccd_verified: string;
  profile_declaration_verified: string;
  profile_owner_verified: string;
  profile_domain_verified: string;
  redemption_days: string;
  pending_delete_days: string;
  dns_records_json: DnsRecord[];
  name_servers_json: string[];
  child_dns_json: ChildDnsRow[];
  email_forwards_json: EmailForwardRow[];
  security_services_json: SecurityService[];
  two_factor_enabled: string;
};

export type DomainJsonField =
  | "dns_records_json"
  | "name_servers_json"
  | "child_dns_json"
  | "email_forwards_json"
  | "security_services_json"
  | "two_factor_enabled";

export type DomainOverviewField =
  | "owner_name"
  | "owner_address"
  | "owner_phone"
  | "owner_email"
  | "owner_postcode"
  | "registration_date"
  | "expiry_date"
  | "estimated_value"
  | "domain_status"
  | "protection_level"
  | "profile_cccd_verified"
  | "profile_declaration_verified"
  | "profile_owner_verified"
  | "profile_domain_verified"
  | "redemption_days"
  | "pending_delete_days";
