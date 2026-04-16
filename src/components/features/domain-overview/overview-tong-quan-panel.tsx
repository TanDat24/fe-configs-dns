import { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import type { DomainConfig, DomainOverviewField } from "@/lib/domain-types";
import { computeProtectionLevel } from "@/lib/domain-types";
import { DomainSummaryCards } from "./domain-summary-cards";

const TEAL = "text-teal-600";

type OverviewTongQuanPanelProps = {
  data: DomainConfig;
  onSaveOverview: (fields: Partial<Record<DomainOverviewField, string>>) => Promise<void>;
  saving: boolean;
};

type OwnerDraft = {
  owner_name: string;
  owner_address: string;
  owner_phone: string;
  owner_email: string;
  owner_postcode: string;
};

function circleClass(v: "active" | "muted" | "danger") {
  return cn(
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white",
    v === "active" && "bg-zinc-700",
    v === "muted" && "bg-zinc-300",
    v === "danger" && "bg-red-500",
  );
}

export function OverviewTongQuanPanel({ data, onSaveOverview, saving }: OverviewTongQuanPanelProps) {
  const [editingOwner, setEditingOwner] = useState(false);
  const [owner, setOwner] = useState<OwnerDraft>({
    owner_name: data.owner_name,
    owner_address: data.owner_address,
    owner_phone: data.owner_phone,
    owner_email: data.owner_email,
    owner_postcode: data.owner_postcode,
  });

  const protectionLevel = computeProtectionLevel(
    data.security_services_json ?? [],
    data.two_factor_enabled === "1",
  );

  const redDays = data.redemption_days || "30";
  const pendingDays = data.pending_delete_days || "5";

  const lifecycle = useMemo(() => {
    return [
      { num: 1, circle: "active" as const, title: "Ngày đăng ký", date: data.registration_date, footer: "Gia hạn giá thường" },
      { num: 2, circle: "muted" as const, title: "Ngày hết hạn", date: data.expiry_date, footer: `${redDays} ngày / Gia hạn giá thường` },
      { num: 3, circle: "muted" as const, title: "Chuộc", footer: `${redDays} ngày / Gia hạn giá cao` },
      { num: 4, circle: "muted" as const, title: "Chờ xoá", footer: `${pendingDays} ngày / Không thể gia hạn` },
      { num: 5, circle: "danger" as const, title: "Tự do", footer: "" },
    ];
  }, [data.registration_date, data.expiry_date, redDays, pendingDays]);

  const domainDataWithProtection = useMemo(
    () => ({ ...data, ...owner, protection_level: String(protectionLevel) }),
    [data, owner, protectionLevel],
  );

  return (
    <div className="space-y-4 py-5">
      <DomainSummaryCards data={domainDataWithProtection} />

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="flex items-center justify-between gap-3 bg-zinc-100 px-4 py-3 sm:px-5">
          <h2 className={`text-sm font-semibold sm:text-base ${TEAL}`}>Thông tin chủ thể</h2>
          <button
            type="button"
            className="shrink-0 rounded border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-900 transition hover:bg-zinc-50 sm:text-sm"
            onClick={() => setEditingOwner((v) => !v)}
          >
            {editingOwner ? "Huỷ" : "Chỉnh sửa"}
          </button>
        </div>
        <div className="p-4 sm:p-5">
          {editingOwner ? (
            <div className="space-y-3 text-sm">
              {([
                ["owner_name", "Tên"],
                ["owner_address", "Địa chỉ"],
                ["owner_phone", "Điện thoại"],
                ["owner_email", "Email"],
                ["owner_postcode", "Mã bưu chính"],
              ] as Array<[keyof OwnerDraft, string]>).map(([k, label]) => (
                <div key={k} className="grid grid-cols-1 gap-2 sm:grid-cols-[8rem_1fr]">
                  <label className="text-zinc-600">{label}</label>
                  <input
                    className="rounded-md border border-zinc-300 px-3 py-2"
                    value={owner[k]}
                    onChange={(e) => setOwner((prev) => ({ ...prev, [k]: e.target.value }))}
                  />
                </div>
              ))}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={saving}
                  onClick={async () => {
                    await onSaveOverview(owner);
                    setEditingOwner(false);
                  }}
                  className="rounded-md bg-zinc-700 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {saving ? "Đang lưu..." : "Lưu thông tin chủ thể"}
                </button>
              </div>
            </div>
          ) : (
            <dl className="space-y-3 text-sm">
              {[
                ["Tên", owner.owner_name],
                ["Địa chỉ", owner.owner_address],
                ["Điện thoại", owner.owner_phone],
                ["E-mail", owner.owner_email],
                ["Mã bưu chính", owner.owner_postcode],
              ].map(([label, value]) => (
                <div key={String(label)} className="grid grid-cols-1 gap-1 border-b border-zinc-100 pb-3 last:border-0 last:pb-0 sm:grid-cols-[7.5rem_1fr] sm:gap-x-6">
                  <dt className="text-zinc-500">{label}</dt>
                  <dd className="font-medium text-zinc-900">{value || "-"}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </section>

      <section className="overflow-hidden rounded-lg border border-zinc-200 bg-white">
        <div className="bg-zinc-100 px-4 py-4 sm:px-5">
          <h2 className={`text-sm font-semibold sm:text-base ${TEAL}`}>Vòng đời tên miền Quốc tế</h2>
        </div>
        <div className="space-y-4 p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {([
              ["Ngày đăng ký", data.registration_date],
              ["Ngày hết hạn", data.expiry_date],
              ["Trạng thái", data.domain_status],
              ["Giá trị ước tính", data.estimated_value],
            ] as Array<[string, string]>).map(([label, value]) => (
              <div key={label} className="rounded-md border border-zinc-100 bg-zinc-50 px-3 py-2.5">
                <dt className="text-xs text-zinc-500">{label}</dt>
                <dd className="mt-0.5 font-medium text-zinc-900">{value || "-"}</dd>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-5 gap-1 text-center">
            {lifecycle.map((s) => (
              <div key={s.num} className="min-h-[2.75rem] px-0.5">
                <div className="text-[11px] font-medium leading-tight text-zinc-800 sm:text-xs">{s.title}</div>
                {s.date ? <div className="mt-0.5 text-[10px] text-zinc-500 sm:text-[11px]">{s.date}</div> : null}
              </div>
            ))}
          </div>

          <div className="relative mx-0 my-4 h-10 sm:mx-2">
            <div className="absolute left-0 right-0 top-1/2 h-3 -translate-y-1/2 rounded-full bg-zinc-200" />
            <div className="absolute left-0 top-1/2 h-3 -translate-y-1/2 rounded-l-full bg-zinc-500" style={{ width: "22%" }} />
            <div className="absolute inset-0 flex">
              {lifecycle.map((s) => (
                <div key={s.num} className="flex flex-1 items-center justify-center">
                  <div className={circleClass(s.circle)}>{s.num}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-5 gap-1 text-center text-[10px] text-zinc-700 sm:text-[11px]">
            {lifecycle.map((s) => (
              <div key={s.num}>{s.footer}</div>
            ))}
          </div>

          <div className="rounded-md bg-zinc-50 px-4 py-3 text-sm text-zinc-600">
            <p>Các thông tin ngày đăng ký, ngày hết hạn, trạng thái tên miền được quản lý bởi hệ thống. Để thay đổi, vui lòng liên hệ bộ phận hỗ trợ hoặc truy cập wp-admin.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
