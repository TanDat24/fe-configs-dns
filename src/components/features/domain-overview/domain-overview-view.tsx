"use client";

import { DnsTabPanel } from "./dns-tab-panel";
import { DomainSubnav, type DomainTabId } from "./domain-subnav";
import { OverviewTongQuanPanel } from "./overview-tong-quan-panel";
import { SecurityTabPanel } from "./security-tab-panel";
import { useEffect, useState } from "react";
import { useDomainOverview } from "@/hooks";

function PanelSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-6 py-6">
      <div className="h-6 w-56 animate-pulse rounded bg-zinc-200" />
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-12 animate-pulse rounded-md bg-zinc-100" />
      ))}
    </div>
  );
}

function OfflineHint() {
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const sync = () => setIsOffline(typeof navigator !== "undefined" && navigator.onLine === false);
    sync();
    window.addEventListener("online", sync);
    window.addEventListener("offline", sync);
    return () => {
      window.removeEventListener("online", sync);
      window.removeEventListener("offline", sync);
    };
  }, []);

  if (isOffline) {
    return (
      <div className="mx-6 my-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        Ban dang offline. Du lieu se khong the dong bo cho den khi co mang.
      </div>
    );
  }
  return null;
}

export function DomainOverviewView() {
  const [tab, setTab] = useState<DomainTabId>("overview");
  const {
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
    defaultDomainName,
  } = useDomainOverview();

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
          domainName={domainData?.domain || defaultDomainName}
          activeTab={tab}
          onTabChange={setTab}
        />

        <OfflineHint />

        {error ? (
          <div className="mx-6 my-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        ) : null}

        {loading && tab === "overview" ? <PanelSkeleton rows={7} /> : null}
        {loading && tab === "dns" ? <PanelSkeleton rows={9} /> : null}
        {loading && tab === "security" ? <PanelSkeleton rows={6} /> : null}

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
