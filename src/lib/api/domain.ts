import { apiJson } from "./client";
import type { SaveDomainTabRequestDto, SaveDomainTabResponseDto } from "@/lib/contracts/api";
import type {
  DnsTemplate,
  DomainConfig,
  DomainJsonField,
  DomainOverviewField,
  SecurityPackage,
} from "@/lib/domain-types";

export type DomainOption = {
  id: number;
  domain: string;
  slug: string;
};

export async function getDomainsList(): Promise<DomainOption[]> {
  const data = await apiJson<{ items: DomainOption[] }>("/api/domain/list", { method: "GET" });
  return data.items;
}

export async function getDomainConfig(slug: string): Promise<DomainConfig> {
  const data = await apiJson<{ item: DomainConfig }>(`/api/domain/${encodeURIComponent(slug)}`, {
    method: "GET",
  });
  return data.item;
}

export async function getDnsTemplates(): Promise<DnsTemplate[]> {
  const data = await apiJson<{ items: DnsTemplate[] }>("/api/domain/templates", {
    method: "GET",
  });
  return data.items;
}

export async function getSecurityPackages(): Promise<SecurityPackage[]> {
  const data = await apiJson<{ items: SecurityPackage[] }>("/api/domain/security-packages", {
    method: "GET",
  });
  return data.items;
}

export async function saveDomainJsonTab(input: SaveDomainTabRequestDto & {
  field: DomainJsonField | DomainOverviewField;
}): Promise<SaveDomainTabResponseDto> {
  return apiJson<SaveDomainTabResponseDto>("/api/domain/save-tab", {
    method: "POST",
    json: input,
  });
}

export async function saveDomainOverviewFields(input: {
  domainId: number;
  fields: Partial<Record<DomainOverviewField, string>>;
}): Promise<{ message: string }> {
  const entries = Object.entries(input.fields).filter(([, v]) => typeof v === "string") as Array<[
    DomainOverviewField,
    string,
  ]>;

  for (const [field, value] of entries) {
    await saveDomainJsonTab({ domainId: input.domainId, field, payload: value });
  }

  return { message: "Da luu thong tin tong quan." };
}
