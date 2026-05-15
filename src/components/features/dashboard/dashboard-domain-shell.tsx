"use client";

import { DomainSubnav, type DomainTabId } from "@/components/features/domain-overview/domain-subnav";
import { useDomainOverview } from "@/hooks";

function PanelSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-6 py-6">
      <div className="h-6 w-56 animate-pulse rounded bg-zinc-200" />
      {Array.from({ length: rows }).map((_, idx) => (
        <div key={idx} className="h-12 animate-pulse rounded-md bg-zinc-100" />
      ))}
    </div>
  );
}

function EmptyDomainsState() {
  return (
    <div className="flex flex-1 items-center justify-center px-4 py-16">
      <div className="flex w-full max-w-xl flex-col items-center rounded-2xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm sm:px-10 sm:py-14">
        <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-teal-50 to-sky-50 ring-1 ring-teal-100">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-10 w-10 text-teal-600" aria-hidden>
            <circle cx="12" cy="12" r="9" strokeLinecap="round" strokeLinejoin="round" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.6 9h16.8M3.6 15h16.8M12 3c2.5 3 2.5 15 0 18M12 3c-2.5 3-2.5 15 0 18" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-zinc-900 sm:text-xl">Bạn chưa có tên miền nào</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-zinc-500">
          Tài khoản của bạn chưa được liên kết với tên miền dịch vụ nào. Nếu đã sở hữu tên miền, vui lòng liên hệ quản trị viên để liên kết.
        </p>
      </div>
    </div>
  );
}

type DashboardDomainShellProps = {
  children: React.ReactNode;
  activeTab?: DomainTabId;
  loadingContent?: boolean;
};

export function DashboardDomainShell({
  children,
  activeTab = "overview",
  loadingContent = false,
}: DashboardDomainShellProps) {
  const {
    domainData,
    domains,
    selectedSlug,
    setSelectedSlug,
    loading,
    error,
    defaultDomainName,
  } = useDomainOverview();

  const hasNoDomains = !loading && domains.length === 0;

  if (hasNoDomains) {
    return (
      <div className="flex min-h-0 flex-1 flex-col font-sans">
        <EmptyDomainsState />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col font-sans">
      {domains.length > 0 ? (
        <div className="mb-2 flex items-center gap-2 py-2">
          <span className="text-sm text-zinc-600">Tên miền:</span>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="rounded-md border border-zinc-300 bg-white px-2 py-1.5 text-sm"
          >
            {domains.map((d) => (
              <option key={d.id} value={d.slug}>
                {d.domain}
              </option>
            ))}
          </select>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg bg-white">
        <DomainSubnav domainName={domainData?.domain || defaultDomainName} activeTab={activeTab} />

        {error ? (
          <div className="mx-6 my-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</div>
        ) : null}

        {loading || loadingContent ? <PanelSkeleton rows={6} /> : <div className="bg-white">{children}</div>}
      </div>
    </div>
  );
}
