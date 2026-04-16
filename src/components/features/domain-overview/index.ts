import type { DomainConfig } from "@/lib/domain-types";

export const DEFAULT_DOMAIN_NAME = "raotin247.com";
export const DEFAULT_DOMAIN_SLUG = "raotin247-com";

export const DEFAULT_DOMAIN_CONFIG: DomainConfig = {
  id: 0,
  domain: DEFAULT_DOMAIN_NAME,
  slug: DEFAULT_DOMAIN_SLUG,
  owner_name: "Au Vuong Le",
  owner_address: "30 Ho Ngoc Can, Phuong Phu Tho Hoa, TP. Ho Chi Minh",
  owner_phone: "+84.979247783",
  owner_email: "leauvuong@gmail.com",
  owner_postcode: "700000",
  registration_date: "23-07-2020",
  expiry_date: "23-07-2026",
  estimated_value: "6210000",
  domain_status: "Đang hoạt động",
  protection_level: "0",
  profile_cccd_verified: "1",
  profile_declaration_verified: "1",
  profile_owner_verified: "0",
  profile_domain_verified: "0",
  redemption_days: "30",
  pending_delete_days: "5",
  dns_records_json: [
    { host: "blog", type: "A", value: "103.57.221.79", ttl: "300", priority: "" },
  ],
  name_servers_json: ["nsbak.pavietnam.net", "ns1.pavietnam.vn", "ns2.pavietnam.vn"],
  child_dns_json: [{ name: "ns1", ipv4: "103.57.221.79", ipv6: "" }],
  email_forwards_json: [{ source: "info", target: "leauvuong@gmail.com" }],
  security_services_json: [],
  two_factor_enabled: "0",
};

export { DomainOverviewView } from "./domain-overview-view";
export { DomainSubnav, DOMAIN_TAB_IDS } from "./domain-subnav";
export type { DomainTabId } from "./domain-subnav";
export { DomainSummaryCards } from "./domain-summary-cards";
export { ProtectionGauge } from "./protection-gauge";
export { SecurityTabPanel } from "./security-tab-panel";
