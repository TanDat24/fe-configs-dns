import { cn } from "@/lib/utils";
import Link from "next/link";
import { ProtectionGauge } from "./protection-gauge";
import type { DomainConfig } from "@/lib/domain-types";

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
      <circle cx="12" cy="12" r="10" />
      <path strokeLinecap="round" d="M12 16v-4m0-4h.01" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor" aria-hidden>
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-7.5 10.5a.75.75 0 01-1.127.077l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 6.951-9.73a.75.75 0 011.052-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

type DomainSummaryCardsProps = {
  data: DomainConfig;
};

function safeProtectionLevel(input: string | number | null | undefined): number {
  const n = typeof input === "number" ? input : Number.parseInt(String(input ?? "").trim(), 10);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(5, n));
}

function levelColor(level: number): string {
  if (level <= 1) return "text-red-600";
  if (level === 2) return "text-orange-500";
  if (level === 3) return "text-yellow-500";
  if (level === 4) return "text-lime-600";
  return "text-green-600";
}

export function DomainSummaryCards({ data }: DomainSummaryCardsProps) {
  const protectionLevel = safeProtectionLevel(data.protection_level);

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <section className="flex flex-col rounded-lg border border-zinc-200 bg-white p-5">
        <h2 className="text-base font-semibold text-zinc-900">Thông tin tên miền</h2>
        <dl className="mt-4 space-y-3 text-sm">
          <div className="flex justify-between gap-2 border-b border-zinc-100 pb-2">
            <dt className="text-zinc-500">Ngày hết hạn</dt>
            <dd className="font-medium text-zinc-900">{data.expiry_date || "-"}</dd>
          </div>
          <div className="flex justify-between gap-2 border-b border-zinc-100 pb-2">
            <dt className="text-zinc-500">Giá trị ước tính</dt>
            <dd className="font-medium text-zinc-900">{data.estimated_value || "-"}</dd>
          </div>
          <div className="flex justify-between gap-2">
            <dt className="text-zinc-500">Trạng thái</dt>
            <dd className="font-medium text-emerald-600">{data.domain_status || "-"}</dd>
          </div>
        </dl>
      </section>

      <section className="flex flex-col rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <h2 className="text-base font-semibold text-zinc-900">Mức độ bảo vệ</h2>
            <InfoIcon className="h-4 w-4 text-zinc-400" />
          </div>
        </div>
        <div className="mt-2 flex flex-1 flex-col">
          <ProtectionGauge level={protectionLevel} />
          <p className={cn("text-center text-xl font-bold", levelColor(protectionLevel))}>
            Cấp {protectionLevel}
          </p>
          <p className="mx-auto mt-2 max-w-[14rem] text-center text-xs leading-relaxed text-zinc-600">
            {protectionLevel === 0
              ? "Chưa bật dịch vụ bảo mật nào. Vào tab Bảo mật để kích hoạt."
              : protectionLevel < 3
                ? "Mức bảo vệ thấp. Bật thêm dịch vụ để nâng cấp."
                : protectionLevel < 5
                  ? "Mức bảo vệ trung bình. Bật tất cả dịch vụ để đạt mức tối đa."
                  : "Mức bảo vệ tối đa. Tên miền được bảo vệ toàn diện."}
          </p>
        </div>
      </section>

      <section className="flex flex-col rounded-lg border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-zinc-900">Hồ sơ</h2>
          <Link
            href="/profile/cccd"
            className="inline-flex h-8 items-center rounded-md border border-zinc-200 px-3 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
          >
            Upload CCCD
          </Link>
        </div>
        <ul className="mt-4 space-y-3 text-sm">
          <li className="flex items-center justify-between gap-2">
            <span className="text-zinc-700">CCCD chủ sở hữu</span>
            {data.profile_cccd_verified === "1" ? <CheckIcon className="h-5 w-5 text-emerald-500" /> : <span className="text-amber-600 text-xs">Chưa xác minh</span>}
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="text-zinc-700">Tờ khai</span>
            {data.profile_declaration_verified === "1" ? <CheckIcon className="h-5 w-5 text-emerald-500" /> : <span className="text-amber-600 text-xs">Chưa xác minh</span>}
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="text-zinc-700">Xác minh chủ sở hữu</span>
            {data.profile_owner_verified === "1" ? <CheckIcon className="h-5 w-5 text-emerald-500" /> : <span className="text-amber-600 text-xs">Cần xử lý</span>}
          </li>
          <li className="flex items-center justify-between gap-2">
            <span className="text-zinc-700">Xác minh tên miền</span>
            {data.profile_domain_verified === "1" ? <CheckIcon className="h-5 w-5 text-emerald-500" /> : <span className="text-amber-600 text-xs">Cần xử lý</span>}
          </li>
        </ul>
      </section>
    </div>
  );
}
