"use client";

import { cn } from "@/lib/utils";
import Link from "next/link";
import { usePathname } from "next/navigation";

export const DOMAIN_TAB_IDS = [
  "overview",
  "dns",
  "security", // Cài đặt bảo mật (domain)
  "contacts",
  "billing-orders",
  "verification",
  "support-tickets",
] as const;
export type DomainTabId = (typeof DOMAIN_TAB_IDS)[number];

type SubnavItem = { tabId: DomainTabId; label: string };

// Đồng nhất 1 thanh: mọi nút đều đổi panel bằng query (?tab=...),
// không điều hướng sang layout khác.
const SUBNAV_ITEMS: SubnavItem[] = [
  { tabId: "overview", label: "Tổng quan" },
  { tabId: "dns", label: "DNS" },
  { tabId: "security", label: "Cài đặt bảo mật" },

  { tabId: "contacts", label: "Liên hệ" },
  { tabId: "billing-orders", label: "Thanh toán & Đơn hàng" },
  { tabId: "verification", label: "Xác minh (KYC)" },
  { tabId: "support-tickets", label: "Hỗ trợ / Vé" },
];

/** Nền dải tên miền — mint rất nhạt */
const BG_DOMAIN = "#EDF8F6";
/** Nền thanh tab — mint đậm hơn một chút */
const BG_TABS = "#CCEAE4";

type DomainSubnavProps = {
  domainName: string;
  activeTab: DomainTabId;
};

export function DomainSubnav({
  domainName,
  activeTab,
}: DomainSubnavProps) {
  const pathname = usePathname();

  const linkBaseClass =
    "rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50";

  const base = pathname.startsWith("/domains") ? "/domains" : "/dashboard";

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

      <div style={{ backgroundColor: BG_TABS }}>
        <div className="px-4 py-2.5 sm:px-6">
          <nav className="flex flex-wrap gap-2" aria-label="Điều hướng hệ thống & tên miền">
            {SUBNAV_ITEMS.map((item) => {
              const href = `${base}?tab=${item.tabId}`;
              const active = item.tabId === activeTab;

              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-md px-3 py-1.5 text-sm transition",
                    active ? "bg-zinc-900 text-white" : linkBaseClass,
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </div>
  );
}
