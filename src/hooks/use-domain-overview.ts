"use client";

import { useEffect, useMemo, useState } from "react";
import { getViewer } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type {
  DnsTemplate,
  DomainConfig,
  DomainJsonField,
  DomainOverviewField,
  SecurityPackage,
  SecurityService,
} from "@/lib/domain-types";
import type { DomainOption } from "@/lib/api/domain";
import {
  loadDomainBootData,
  loadDomainDetail,
  saveDomainOverview,
  saveDomainSecurityServices,
  saveDomainTabField,
  saveDomainTwoFactor,
  updateMyPassword,
} from "@/services/domain-overview-service";

const DEFAULT_DOMAIN_NAME = "raotin247.com";

function toSlugFromDomain(domain: string): string {
  return domain.trim().toLowerCase().replace(/\./g, "-");
}

function redirectToLogout() {
  const nextPath = `${window.location.pathname}${window.location.search}`;
  window.location.replace(`/logout?next=${encodeURIComponent(nextPath)}`);
}

export function useDomainOverview() {
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
        await getViewer();
        const { domains: domainList, templates: tpl, securityPackages: secPackages } =
          await loadDomainBootData();
        if (cancelled) return;
        setDomains(domainList);
        setTemplates(tpl);
        setSecurityPackages(secPackages);
        if (domainList.length === 0) {
          setSelectedSlug("");
          setDomainData(null);
          setLoading(false);
          return;
        }
        const preferred = domainList.find((d) => d.slug === fallbackSlug) ?? domainList[0];
        setSelectedSlug(preferred?.slug ?? fallbackSlug);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            redirectToLogout();
            return;
          }
          setError(err instanceof ApiError ? err.message : "Khong tai duoc danh sach ten mien.");
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
        const data = await loadDomainDetail(selectedSlug);
        if (!cancelled) setDomainData(data);
      } catch (err) {
        if (!cancelled) {
          if (err instanceof ApiError && err.status === 401) {
            redirectToLogout();
            return;
          }
          setError(err instanceof ApiError ? err.message : "Khong tai duoc du lieu ten mien.");
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
    if (!domainData) throw new Error("Thieu du lieu ten mien.");
    const previous = domainData;
    setSavingField(field);
    setDomainData((prev) => (prev ? { ...prev, [field]: payload } : prev));
    try {
      await saveDomainTabField({ domainId: domainData.id, field, payload });
    } catch (err) {
      setDomainData(previous);
      throw err;
    } finally {
      setSavingField(null);
    }
  }

  async function saveOverview(fields: Partial<Record<DomainOverviewField, string>>) {
    if (!domainData) return;
    const previous = domainData;
    setSavingOverview(true);
    setDomainData((prev) => (prev ? { ...prev, ...fields } : prev));
    try {
      await saveDomainOverview({ domainId: domainData.id, fields });
    } catch (err) {
      setDomainData(previous);
      throw err;
    } finally {
      setSavingOverview(false);
    }
  }

  async function saveSecurityServices(services: SecurityService[]) {
    if (!domainData) throw new Error("Thieu du lieu ten mien.");
    const previous = domainData;
    setSavingField("security_services_json");
    setDomainData((prev) => (prev ? { ...prev, security_services_json: services } : prev));
    try {
      await saveDomainSecurityServices({ domainId: domainData.id, services });
    } catch (err) {
      setDomainData(previous);
      throw err;
    } finally {
      setSavingField(null);
    }
  }

  async function saveTwoFactor(enabled: boolean) {
    if (!domainData) throw new Error("Thieu du lieu ten mien.");
    const previous = domainData;
    setSavingField("two_factor_enabled");
    setDomainData((prev) => (prev ? { ...prev, two_factor_enabled: enabled ? "1" : "0" } : prev));
    try {
      await saveDomainTwoFactor({ domainId: domainData.id, enabled });
    } catch (err) {
      setDomainData(previous);
      throw err;
    } finally {
      setSavingField(null);
    }
  }

  async function handleChangePassword(input: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) {
    await updateMyPassword(input);
  }

  return {
    domainData,
    domains,
    templates,
    securityPackages,
    selectedSlug,
    setSelectedSlug,
    loading,
    error,
    savingField,
    savingOverview,
    saveTab,
    saveOverview,
    saveSecurityServices,
    saveTwoFactor,
    handleChangePassword,
    defaultDomainName: DEFAULT_DOMAIN_NAME,
  };
}
