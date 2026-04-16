import { changePassword } from "@/lib/api/auth";
import {
  getDnsTemplates,
  getDomainConfig,
  getDomainsList,
  getSecurityPackages,
  saveDomainJsonTab,
  saveDomainOverviewFields,
  type DomainOption,
} from "@/lib/api/domain";
import type {
  DnsTemplate,
  DomainConfig,
  DomainJsonField,
  DomainOverviewField,
  SecurityPackage,
  SecurityService,
} from "@/lib/domain-types";

export type DomainBootData = {
  domains: DomainOption[];
  templates: DnsTemplate[];
  securityPackages: SecurityPackage[];
};

export async function loadDomainBootData(): Promise<DomainBootData> {
  const [domains, templates, securityPackages] = await Promise.all([
    getDomainsList(),
    getDnsTemplates(),
    getSecurityPackages(),
  ]);
  return { domains, templates, securityPackages };
}

export async function loadDomainDetail(slug: string): Promise<DomainConfig> {
  return getDomainConfig(slug);
}

export async function saveDomainTabField(input: {
  domainId: number;
  field: DomainJsonField;
  payload: unknown;
}): Promise<void> {
  await saveDomainJsonTab(input);
}

export async function saveDomainOverview(input: {
  domainId: number;
  fields: Partial<Record<DomainOverviewField, string>>;
}): Promise<void> {
  await saveDomainOverviewFields(input);
}

export async function saveDomainSecurityServices(input: {
  domainId: number;
  services: SecurityService[];
}): Promise<void> {
  await saveDomainJsonTab({
    domainId: input.domainId,
    field: "security_services_json",
    payload: input.services,
  });
}

export async function saveDomainTwoFactor(input: {
  domainId: number;
  enabled: boolean;
}): Promise<void> {
  await saveDomainJsonTab({
    domainId: input.domainId,
    field: "two_factor_enabled",
    payload: input.enabled ? "1" : "0",
  });
}

export async function updateMyPassword(input: {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}): Promise<void> {
  await changePassword(input);
}
