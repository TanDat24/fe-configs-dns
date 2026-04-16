"use client";

import { useEffect, useMemo, useState } from "react";
import { DnsTabPanel } from "./dns-tab-panel";
import { DomainSubnav, type DomainTabId } from "./domain-subnav";
import { OverviewTongQuanPanel } from "./overview-tong-quan-panel";
import { SecurityTabPanel } from "./security-tab-panel";
import {
  getDnsTemplates,
  getDomainConfig,
  getDomainsList,
  getSecurityPackages,
  saveDomainJsonTab,
  saveDomainOverviewFields,
  type DomainOption,
} from "@/lib/api/domain";
import { changePassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type {
  DnsTemplate,
  DomainConfig,
  DomainJsonField,
  DomainOverviewField,
  SecurityService,
  SecurityPackage,
} from "@/lib/domain-types";

const DEFAULT_DOMAIN_NAME = "raotin247.com";

function toSlugFromDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/\./g, "-");
}

export function DomainOverviewView() {
  const [tab, setTab] = useState<DomainTabId>("overview");
  const [domainData, setDomainData] = useState<DomainConfig | null>(null);
  const [domains, setDomains] = useState<DomainOption[]>([]);
  const [templates, setTemplates] = useState<DnsTemplate[]>([]);
  const [securityPackages, setSecurityPackages] = useState<SecurityPackage[]>([]);
  const [selectedSlug, setSelectedSlug] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingField, setSavingField] = useState<DomainJsonField | null>(null);
  const [savingOverview, setSavingOverview] = useState(false);

  const fallbackSlug = useMemo(() => toSlugFromDomain(DEFAULT_DOMAIN_NAME), []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [domainList, tpl, secPackages] = await Promise.all([
          getDomainsList(),
          getDnsTemplates(),
          getSecurityPackages(),
        ]);
        if (cancelled) return;
        setDomains(domainList);
        setTemplates(tpl);
        setSecurityPackages(secPackages);
        const preferred = domainList.find((d) => d.slug === fallbackSlug) ?? domainList[0];
        setSelectedSlug(preferred?.slug ?? fallbackSlug);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Không tải được danh sách tên miền.");
          setLoading(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fallbackSlug]);

  useEffect(() => {
    if (!selectedSlug) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setDomainData(null);
      try {
        const data = await getDomainConfig(selectedSlug);
        if (!cancelled) setDomainData(data);
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Không tải được dữ liệu tên miền.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedSlug]);

  async function saveTab(field: DomainJsonField, payload: unknown) {
    if (!domainData) throw new Error("Thiếu dữ liệu tên miền.");
    setSavingField(field);
    try {
      await saveDomainJsonTab({ domainId: domainData.id, field, payload });
      setDomainData((prev) => (prev ? { ...prev, [field]: payload } : prev));
    } finally {
      setSavingField(null);
    }
  }

  async function saveOverview(fields: Partial<Record<DomainOverviewField, string>>) {
    if (!domainData) return;
    setSavingOverview(true);
    try {
      await saveDomainOverviewFields({ domainId: domainData.id, fields });
      setDomainData((prev) => (prev ? { ...prev, ...fields } : prev));
    } finally {
      setSavingOverview(false);
    }
  }

  async function saveSecurityServices(services: SecurityService[]) {
    if (!domainData) throw new Error("Thiếu dữ liệu tên miền.");
    setSavingField("security_services_json");
    try {
      await saveDomainJsonTab({ domainId: domainData.id, field: "security_services_json", payload: services });
      setDomainData((prev) => prev ? { ...prev, security_services_json: services } : prev);
    } finally {
      setSavingField(null);
    }
  }

  async function saveTwoFactor(enabled: boolean) {
    if (!domainData) throw new Error("Thiếu dữ liệu tên miền.");
    setSavingField("two_factor_enabled");
    try {
      await saveDomainJsonTab({ domainId: domainData.id, field: "two_factor_enabled", payload: enabled ? "1" : "0" });
      setDomainData((prev) => prev ? { ...prev, two_factor_enabled: enabled ? "1" : "0" } : prev);
    } finally {
      setSavingField(null);
    }
  }

  async function handleChangePassword(input: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    await changePassword(input);
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col font-sans">
      <div className="mb-2 flex items-center gap-2 px-1">
        <span className="text-sm text-zinc-600">Tên miền:</span>
        <select
          value={selectedSlug}
          onChange={(e) => setSelectedSlug(e.target.value)}
          className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
        >
          {domains.map((d) => (
            <option key={d.id} value={d.slug}>{d.domain}</option>
          ))}
        </select>
      </div>

      <div className="overflow-hidden rounded-lg bg-white">
        <DomainSubnav
          domainName={domainData?.domain || DEFAULT_DOMAIN_NAME}
          activeTab={tab}
          onTabChange={setTab}
        />

        {loading ? (
          <div className="px-6 py-8 text-sm text-zinc-500">Đang tải dữ liệu tên miền...</div>
        ) : null}

        {error ? (
          <div className="mx-6 my-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {tab === "overview" && domainData ? (
          <div className="bg-white">
            <OverviewTongQuanPanel
              key={`overview-${selectedSlug}-${JSON.stringify({
                owner_name: domainData.owner_name,
                owner_address: domainData.owner_address,
                owner_phone: domainData.owner_phone,
                owner_email: domainData.owner_email,
                owner_postcode: domainData.owner_postcode,
                security_services_json: domainData.security_services_json,
                two_factor_enabled: domainData.two_factor_enabled,
              })}`}
              data={domainData}
              onSaveOverview={saveOverview}
              saving={savingOverview}
            />
          </div>
        ) : null}

        {tab === "dns" && domainData ? (
          <DnsTabPanel
            key={`dns-${selectedSlug}-${JSON.stringify({
              dns_records_json: domainData.dns_records_json,
              name_servers_json: domainData.name_servers_json,
              child_dns_json: domainData.child_dns_json,
              email_forwards_json: domainData.email_forwards_json,
            })}`}
            data={domainData}
            templates={templates}
            onSaveTab={saveTab}
            savingField={savingField}
          />
        ) : null}

        {tab === "security" && domainData ? (
          <SecurityTabPanel
            key={`sec-${selectedSlug}-${JSON.stringify({
              security_services_json: domainData.security_services_json,
              two_factor_enabled: domainData.two_factor_enabled,
            })}`}
            data={domainData}
              packages={securityPackages}
            onSaveSecurityServices={saveSecurityServices}
            onSaveTwoFactor={saveTwoFactor}
              onChangePassword={handleChangePassword}
            saving={savingField === "security_services_json"}
          />
        ) : null}
      </div>
    </div>
  );
}
