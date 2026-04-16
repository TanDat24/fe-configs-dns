"use client";

import { cn } from "@/lib/utils";

export const DOMAIN_TAB_IDS = ["overview", "dns", "security"] as const;
export type DomainTabId = (typeof DOMAIN_TAB_IDS)[number];

const TABS: { id: DomainTabId; label: string }[] = [
  { id: "overview", label: "Tổng quan" },
  { id: "dns", label: "DNS" },
  { id: "security", label: "Cài đặt bảo mật" },
];

/** Nền dải tên miền — mint rất nhạt */
const BG_DOMAIN = "#EDF8F6";
/** Nền thanh tab — mint đậm hơn một chút */
const BG_TABS = "#CCEAE4";

type DomainSubnavProps = {
  domainName: string;
  activeTab: DomainTabId;
  onTabChange: (tab: DomainTabId) => void;
};

export function DomainSubnav({
  domainName,
  activeTab,
  onTabChange,
}: DomainSubnavProps) {
  return (
    <div className="overflow-hidden rounded-t-lg">
      <div
        className="px-4 py-3 sm:px-6"
        style={{ backgroundColor: BG_DOMAIN }}
      >
        <p className="text-left text-base font-semibold text-zinc-900">
          {domainName}
        </p>
      </div>

      <nav
        className="flex flex-wrap gap-x-8 gap-y-1 px-4 py-2.5 sm:px-6"
        style={{ backgroundColor: BG_TABS }}
        aria-label="Điều hướng tên miền"
      >
        {TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={cn(
              "border-b-2 pb-2 text-left text-sm font-medium transition-colors",
              activeTab === tab.id
                ? "border-teal-600 text-teal-600"
                : "border-transparent text-zinc-700 hover:text-zinc-900",
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>
    </div>
  );
}
