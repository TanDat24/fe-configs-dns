import "server-only";
import type { DomainJsonField } from "@/lib/domain-types";

type GraphqlBase = { errors?: Array<{ message: string }> };
type DomainOptionRaw = { id?: number | null; domain?: string | null; slug?: string | null };
type DnsTemplateRaw = { id?: number | null; title?: string | null; records_json?: string | null };
type SecurityPackageRaw = { id?: number | null; title?: string | null; description?: string | null };
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

type DomainsListResponse = GraphqlBase & { data?: { dnsDomainsList?: DomainOptionRaw[] | null } };
type DomainBySlugResponse = GraphqlBase & { data?: { dnsDomainBySlug?: DomainRaw | null } };
type TemplatesResponse = GraphqlBase & { data?: { dnsTemplatesList?: DnsTemplateRaw[] | null } };
type SecurityPackagesResponse = GraphqlBase & { data?: { securityPackagesList?: SecurityPackageRaw[] | null } };
type SaveResponse = GraphqlBase & { data?: { saveDnsDomainJsonTab?: { ok?: boolean | null; code?: string | null; message?: string | null } | null } };

const DOMAINS_LIST_QUERY = `query DomainsList { dnsDomainsList { id domain slug } }`;
const DOMAIN_BY_SLUG_QUERY = `
  query DomainBySlug($slug: String!) {
    dnsDomainBySlug(slug: $slug) {
      id domain slug owner_name owner_address owner_phone owner_email owner_postcode registration_date expiry_date estimated_value domain_status protection_level profile_cccd_verified profile_declaration_verified profile_owner_verified profile_domain_verified redemption_days pending_delete_days dns_records_json name_servers_json child_dns_json email_forwards_json security_services_json two_factor_enabled
    }
  }
`;
const DNS_TEMPLATES_QUERY = `query DnsTemplates { dnsTemplatesList { id title records_json } }`;
const SECURITY_PACKAGES_QUERY = `query SecurityPackages { securityPackagesList { id title description } }`;
const SAVE_JSON_TAB_MUTATION = `
  mutation SaveDnsDomainJsonTab($domainId: Int!, $field: String!, $payloadJson: String!) {
    saveDnsDomainJsonTab(input: { domainId: $domainId field: $field payloadJson: $payloadJson }) { ok code message }
  }
`;

async function parseWpJson<T>(response: Response): Promise<T> {
  const text = await response.text();
  try { return JSON.parse(text) as T; } catch {
    const jsonStart = text.indexOf("{");
    if (jsonStart >= 0) return JSON.parse(text.slice(jsonStart)) as T;
    throw new Error("invalid_json");
  }
}

async function wpGraphql<T>(endpoint: string, authToken: string, query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${authToken}` },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  return await parseWpJson<T>(res);
}

export async function wpGetDomainsList(endpoint: string, authToken: string): Promise<{ ok: true; items: DomainOptionRaw[] } | { ok: false; status: number; message: string }> {
  try {
    const json = await wpGraphql<DomainsListResponse>(endpoint, authToken, DOMAINS_LIST_QUERY);
    if (json.errors?.length) return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    return { ok: true, items: json.data?.dnsDomainsList ?? [] };
  } catch {
    return { ok: false, status: 502, message: "Loi goi WordPress GraphQL." };
  }
}

export async function wpGetDomainBySlug(endpoint: string, authToken: string, slug: string): Promise<{ ok: true; domain: DomainRaw | null } | { ok: false; status: number; message: string }> {
  try {
    const json = await wpGraphql<DomainBySlugResponse>(endpoint, authToken, DOMAIN_BY_SLUG_QUERY, { slug });
    if (json.errors?.length) return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    return { ok: true, domain: json.data?.dnsDomainBySlug ?? null };
  } catch {
    return { ok: false, status: 502, message: "Loi goi WordPress GraphQL." };
  }
}

export async function wpGetDnsTemplates(endpoint: string, authToken: string): Promise<{ ok: true; items: DnsTemplateRaw[] } | { ok: false; status: number; message: string }> {
  try {
    const json = await wpGraphql<TemplatesResponse>(endpoint, authToken, DNS_TEMPLATES_QUERY);
    if (json.errors?.length) return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    return { ok: true, items: json.data?.dnsTemplatesList ?? [] };
  } catch {
    return { ok: false, status: 502, message: "Loi goi WordPress GraphQL." };
  }
}

export async function wpGetSecurityPackages(endpoint: string, authToken: string): Promise<{ ok: true; items: SecurityPackageRaw[] } | { ok: false; status: number; message: string }> {
  try {
    const json = await wpGraphql<SecurityPackagesResponse>(endpoint, authToken, SECURITY_PACKAGES_QUERY);
    if (json.errors?.length) return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    return { ok: true, items: json.data?.securityPackagesList ?? [] };
  } catch {
    return { ok: false, status: 502, message: "Loi goi WordPress GraphQL." };
  }
}

export async function wpSaveDomainJsonTab(endpoint: string, authToken: string, input: { domainId: number; field: DomainJsonField | string; payloadJson: string; }): Promise<{ ok: true; message: string } | { ok: false; status: number; message: string }> {
  try {
    const json = await wpGraphql<SaveResponse>(endpoint, authToken, SAVE_JSON_TAB_MUTATION, input);
    if (json.errors?.length) return { ok: false, status: 400, message: json.errors.map((e) => e.message).join(" ") };
    const result = json.data?.saveDnsDomainJsonTab;
    if (!result?.ok) return { ok: false, status: 400, message: result?.message ?? "Luu that bai." };
    return { ok: true, message: result.message ?? "Da luu." };
  } catch {
    return { ok: false, status: 502, message: "Loi goi WordPress GraphQL." };
  }
}
