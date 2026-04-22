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

function EmptyDomainsState() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-xl flex-col items-center rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm sm:px-10 sm:py-14">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-50 to-sky-50 ring-1 ring-teal-100">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            className="h-10 w-10 text-teal-600"
            aria-hidden
          >
            <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.6 9h16.8M3.6 15h16.8M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18"
            />
          </svg>
        </div>

        <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl">
          Bạn chưa có tên miền nào
        </h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
          Tài khoản của bạn chưa được liên kết với tên miền dịch vụ nào.
          Nếu đã sở hữu tên miền, vui lòng liên hệ quản trị viên để liên kết.
        </p>

        <div className="mt-7 grid w-full gap-2 sm:grid-cols-2">
          <a
            href="mailto:support@configsdns.com"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#A8DADC] px-4 text-sm font-semibold text-zinc-900 transition hover:opacity-90"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l9 6 9-6M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Liên hệ quản trị viên
          </a>
          <a
            href="/logout"
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-4 w-4" aria-hidden>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 11c1.657 0 3-1.567 3-3.5S13.657 4 12 4 9 5.567 9 7.5 10.343 11 12 11zm0 0c-3.866 0-7 2.91-7 6.5V20h14v-2.5c0-3.59-3.134-6.5-7-6.5z" />
            </svg>
            Đăng nhập bằng tên miền
          </a>
        </div>

        <div className="mt-6 w-full rounded-lg border border-zinc-100 bg-zinc-50 px-4 py-3 text-left text-xs leading-relaxed text-zinc-500">
          <p className="font-medium text-zinc-700">Gợi ý:</p>
          <ul className="mt-1 list-inside list-disc space-y-0.5">
            <li>Nếu bạn vừa mua tên miền, quản trị viên cần gán nó cho tài khoản của bạn.</li>
            <li>
              Có thể đăng nhập bằng chính <span className="font-mono">tên miền</span> + mật khẩu dịch vụ
              ở trang đăng nhập để quản lý trực tiếp.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
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

  const hasNoDomains = !loading && domains.length === 0;

  if (hasNoDomains) {
    return (
      <div className="flex min-h-0 flex-1 flex-col font-sans">
        <OfflineHint />
        <EmptyDomainsState />
      </div>
    );
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
