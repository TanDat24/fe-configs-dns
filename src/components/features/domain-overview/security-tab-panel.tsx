"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { ApiError } from "@/lib/api/client";
import type {
  DomainConfig,
  SecurityPackage,
  SecurityService,
} from "@/lib/domain-types";
import { computeProtectionLevel } from "@/lib/domain-types";

const SIDEBAR_ITEMS = [
  "Bảo mật tên miền",
  "Bảo mật tài khoản 2 lớp",
  "Đổi mật khẩu",
] as const;

function ShieldIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 2.25l8.25 3.75v6c0 5.03-3.54 9.22-8.25 10.5C7.29 21.22 3.75 17.03 3.75 12V6L12 2.25z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
    </svg>
  );
}

function EyeIcon({ open, className }: { open: boolean; className?: string }) {
  if (open) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12c1.292 4.338 5.31 7.5 10.066 7.5.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  );
}

function strengthLabel(pw: string): { text: string; color: string; percent: number } {
  if (pw.length === 0) return { text: "", color: "bg-zinc-200", percent: 0 };
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  if (score <= 1) return { text: "Yếu", color: "bg-red-500", percent: 20 };
  if (score <= 2) return { text: "Trung bình", color: "bg-orange-400", percent: 40 };
  if (score <= 3) return { text: "Khá", color: "bg-yellow-400", percent: 60 };
  if (score <= 4) return { text: "Mạnh", color: "bg-lime-500", percent: 80 };
  return { text: "Rất mạnh", color: "bg-green-500", percent: 100 };
}

type SecurityTabPanelProps = {
  data: DomainConfig;
  packages: SecurityPackage[];
  onSaveSecurityServices: (services: SecurityService[]) => Promise<void>;
  onSaveTwoFactor: (enabled: boolean) => Promise<void>;
  onChangePassword: (input: {
    oldPassword: string;
    newPassword: string;
    confirmPassword: string;
  }) => Promise<void>;
  saving: boolean;
};

function buildServices(
  packages: SecurityPackage[],
  saved: SecurityService[],
): SecurityService[] {
  return packages.map((pkg) => {
    const key = String(pkg.id);
    const existing = saved.find((s) => s.id === key);
    return {
      id: key,
      title: pkg.title,
      description: pkg.description,
      enabled: existing?.enabled ?? false,
    };
  });
}

export function SecurityTabPanel({
  data,
  packages,
  onSaveSecurityServices,
  onSaveTwoFactor,
  onChangePassword,
  saving,
}: SecurityTabPanelProps) {
  const [activeSub, setActiveSub] = useState(0);
  const [services, setServices] = useState<SecurityService[]>(() =>
    buildServices(packages, data.security_services_json ?? []),
  );
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    data.two_factor_enabled === "1",
  );
  const [saving2fa, setSaving2fa] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [passwordNotice, setPasswordNotice] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);
  const [serviceNotice, setServiceNotice] = useState<{
    type: "ok" | "error";
    text: string;
  } | null>(null);

  const protectionLevel = computeProtectionLevel(services, twoFactorEnabled);
  const strength = strengthLabel(passwordForm.newPassword);

  async function toggleService(id: string) {
    const next = services.map((s) =>
      s.id === id ? { ...s, enabled: !s.enabled } : s,
    );
    setServices(next);
    setServiceNotice(null);
    try {
      await onSaveSecurityServices(next);
      setServiceNotice({ type: "ok", text: "Đã cập nhật trạng thái dịch vụ." });
    } catch (err) {
      setServices(services);
      const msg =
        err instanceof ApiError ? err.message : "Không cập nhật được.";
      setServiceNotice({ type: "error", text: msg });
    }
  }

  async function toggleTwoFactor() {
    const next = !twoFactorEnabled;
    setTwoFactorEnabled(next);
    setSaving2fa(true);
    try {
      await onSaveTwoFactor(next);
    } catch {
      setTwoFactorEnabled(!next);
    } finally {
      setSaving2fa(false);
    }
  }

  async function submitChangePassword() {
    setPasswordNotice(null);
    const { oldPassword, newPassword, confirmPassword } = passwordForm;
    if (!oldPassword || !newPassword || !confirmPassword) {
      setPasswordNotice({
        type: "error",
        text: "Vui lòng nhập đầy đủ các trường.",
      });
      return;
    }
    if (newPassword.length < 8) {
      setPasswordNotice({
        type: "error",
        text: "Mật khẩu mới tối thiểu 8 ký tự.",
      });
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordNotice({
        type: "error",
        text: "Mật khẩu xác nhận không khớp.",
      });
      return;
    }

    setSavingPassword(true);
    try {
      await onChangePassword(passwordForm);
      setPasswordForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setPasswordNotice({ type: "ok", text: "Đổi mật khẩu thành công." });
    } catch (err) {
      const msg =
        err instanceof ApiError ? err.message : "Không đổi được mật khẩu.";
      setPasswordNotice({ type: "error", text: msg });
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="bg-white">
      <div className="border-b border-zinc-200 px-4 py-4 sm:px-6">
        <h1 className="text-xl font-bold text-zinc-900 sm:text-2xl">
          Cài đặt bảo mật tên miền
        </h1>
      </div>

      <div className="flex min-h-[min(60vh,480px)] flex-col lg:flex-row">
        <aside className="shrink-0 border-b border-zinc-200 lg:w-64 lg:border-b-0 lg:border-r">
          <nav
            className="flex flex-col gap-0.5 p-3 lg:p-4"
            aria-label="Cài đặt bảo mật"
          >
            {SIDEBAR_ITEMS.map((label, index) => (
              <button
                key={label}
                type="button"
                onClick={() => setActiveSub(index)}
                className={cn(
                  "rounded-md px-3 py-2.5 text-left text-sm transition-colors",
                  activeSub === index
                    ? "bg-[#e0e0e0] font-medium text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900",
                )}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="border-t border-zinc-200 px-4 py-3 lg:mt-2">
            <div className="flex items-center gap-2 text-sm">
              <ShieldIcon className="h-5 w-5 text-teal-600" />
              <span className="font-medium text-zinc-900">
                Mức bảo vệ: Cấp {protectionLevel}/5
              </span>
            </div>
            <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-zinc-200">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  protectionLevel <= 1 && "bg-red-500",
                  protectionLevel === 2 && "bg-orange-400",
                  protectionLevel === 3 && "bg-yellow-400",
                  protectionLevel === 4 && "bg-lime-500",
                  protectionLevel >= 5 && "bg-green-500",
                )}
                style={{ width: `${(protectionLevel / 5) * 100}%` }}
              />
            </div>
            <p className="mt-1 text-[11px] text-zinc-500">
              Bật thêm dịch vụ để nâng cấp mức bảo vệ.
            </p>
          </div>
        </aside>

        <div className="min-w-0 flex-1 px-4 pb-8 lg:pl-6 lg:pr-4">
          {activeSub === 0 ? (
            <div className="space-y-4 py-5 pr-0 lg:pr-2">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-teal-600 sm:text-lg">
                  Dịch vụ bảo mật
                </h2>
                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                  {services.filter((s) => s.enabled).length}/{services.length}{" "}
                  đã kích hoạt
                </span>
              </div>
              {serviceNotice ? (
                <div
                  className={cn(
                    "rounded-md px-3 py-2 text-sm",
                    serviceNotice.type === "ok"
                      ? "border border-green-200 bg-green-50 text-green-800"
                      : "border border-red-200 bg-red-50 text-red-800",
                  )}
                >
                  {serviceNotice.text}
                </div>
              ) : null}
              <ul className="space-y-3">
                {services.map((svc) => (
                  <li
                    key={svc.id}
                    className={cn(
                      "flex flex-col gap-3 rounded-lg border p-4 transition-colors sm:flex-row sm:items-center sm:justify-between",
                      svc.enabled
                        ? "border-teal-200 bg-teal-50/50"
                        : "border-zinc-200 bg-white",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <ShieldIcon
                          className={cn(
                            "h-5 w-5 shrink-0",
                            svc.enabled ? "text-teal-600" : "text-zinc-300",
                          )}
                        />
                        <span className="font-medium text-zinc-900">
                          {svc.title}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase",
                            svc.enabled
                              ? "bg-teal-100 text-teal-700"
                              : "bg-zinc-100 text-zinc-500",
                          )}
                        >
                          {svc.enabled ? "Đang bật" : "Tắt"}
                        </span>
                      </div>
                      <p className="mt-1 pl-7 text-sm text-zinc-600">
                        {svc.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={svc.enabled}
                      disabled={saving}
                      onClick={() => toggleService(svc.id)}
                      className={cn(
                        "relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-60",
                        svc.enabled
                          ? "border-teal-400 bg-teal-500"
                          : "border-zinc-300 bg-zinc-100",
                      )}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full transition-all",
                          svc.enabled
                            ? "right-0.5 bg-white"
                            : "left-0.5 bg-zinc-400",
                        )}
                      />
                    </button>
                  </li>
                ))}
              </ul>
              {!packages.length ? (
                <p className="text-sm italic text-zinc-500">
                  Chưa có gói bảo mật nào. Quản trị viên có thể thêm gói tại
                  wp-admin &rarr; Gói bảo mật.
                </p>
              ) : null}
            </div>
          ) : null}

          {activeSub === 1 ? (
            <div className="space-y-4 py-5 pr-0 lg:pr-2">
              <h2 className="text-base font-semibold text-sky-600 sm:text-lg">
                Bảo mật tài khoản 2 lớp (2FA)
              </h2>
              <div className="rounded-lg border border-zinc-200 p-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 pr-2">
                    <p className="font-medium text-zinc-900">
                      Xác thực hai yếu tố
                    </p>
                    <p className="mt-1 text-sm leading-relaxed text-zinc-600">
                      Thêm một lớp bảo vệ khi đăng nhập. Mỗi lần đăng nhập sẽ
                      yêu cầu mã xác nhận từ ứng dụng Authenticator.
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={twoFactorEnabled}
                    disabled={saving2fa}
                    onClick={toggleTwoFactor}
                    className={cn(
                      "relative h-7 w-12 shrink-0 rounded-full border transition-colors disabled:opacity-60",
                      twoFactorEnabled
                        ? "border-teal-400 bg-teal-500"
                        : "border-zinc-300 bg-zinc-100",
                    )}
                  >
                    <span
                      className={cn(
                        "absolute top-0.5 h-5 w-5 rounded-full transition-all",
                        twoFactorEnabled
                          ? "right-0.5 bg-white"
                          : "left-0.5 bg-zinc-400",
                      )}
                    />
                  </button>
                </div>
                <div
                  className={cn(
                    "mt-4 flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                    twoFactorEnabled
                      ? "bg-teal-50 text-teal-800"
                      : "bg-amber-50 text-amber-800",
                  )}
                >
                  <span className="text-base">
                    {twoFactorEnabled ? "✓" : "⚠"}
                  </span>
                  {twoFactorEnabled
                    ? "2FA đang bật. Tài khoản của bạn được bảo vệ thêm một lớp."
                    : "2FA đang tắt. Bật 2FA để tăng mức bảo vệ lên 1 cấp."}
                </div>
              </div>
            </div>
          ) : null}

          {activeSub === 2 ? (
            <div className="space-y-4 py-5 pr-0 lg:pr-2">
              <h2 className="text-base font-semibold text-sky-600 sm:text-lg">
                Đổi mật khẩu
              </h2>
              <div className="space-y-4 rounded-lg border border-zinc-200 p-5">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">
                    Mật khẩu hiện tại
                  </label>
                  <div className="relative">
                    <input
                      type={showOld ? "text" : "password"}
                      value={passwordForm.oldPassword}
                      onChange={(e) =>
                        setPasswordForm((p) => ({
                          ...p,
                          oldPassword: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 pr-10 text-sm"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      onClick={() => setShowOld((v) => !v)}
                    >
                      <EyeIcon open={showOld} className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">
                    Mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showNew ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={(e) =>
                        setPasswordForm((p) => ({
                          ...p,
                          newPassword: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 pr-10 text-sm"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      onClick={() => setShowNew((v) => !v)}
                    >
                      <EyeIcon open={showNew} className="h-5 w-5" />
                    </button>
                  </div>
                  {passwordForm.newPassword.length > 0 ? (
                    <div className="space-y-1 pt-1">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-zinc-200">
                          <div
                            className={cn(
                              "h-full rounded-full transition-all",
                              strength.color,
                            )}
                            style={{ width: `${strength.percent}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-zinc-600">
                          {strength.text}
                        </span>
                      </div>
                      <ul className="flex flex-wrap gap-x-4 gap-y-0.5 text-[11px] text-zinc-500">
                        <li className={passwordForm.newPassword.length >= 8 ? "text-green-600" : ""}>
                          ≥ 8 ký tự
                        </li>
                        <li className={/[A-Z]/.test(passwordForm.newPassword) ? "text-green-600" : ""}>
                          Chữ hoa
                        </li>
                        <li className={/[a-z]/.test(passwordForm.newPassword) ? "text-green-600" : ""}>
                          Chữ thường
                        </li>
                        <li className={/\d/.test(passwordForm.newPassword) ? "text-green-600" : ""}>
                          Số
                        </li>
                        <li className={/[^a-zA-Z0-9]/.test(passwordForm.newPassword) ? "text-green-600" : ""}>
                          Ký tự đặc biệt
                        </li>
                      </ul>
                    </div>
                  ) : null}
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-zinc-700">
                    Xác nhận mật khẩu mới
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={(e) =>
                        setPasswordForm((p) => ({
                          ...p,
                          confirmPassword: e.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 pr-10 text-sm"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      tabIndex={-1}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
                      onClick={() => setShowConfirm((v) => !v)}
                    >
                      <EyeIcon open={showConfirm} className="h-5 w-5" />
                    </button>
                  </div>
                  {passwordForm.confirmPassword.length > 0 &&
                  passwordForm.newPassword !== passwordForm.confirmPassword ? (
                    <p className="text-xs text-red-600">
                      Mật khẩu xác nhận không khớp.
                    </p>
                  ) : null}
                </div>
                <button
                  type="button"
                  disabled={savingPassword}
                  onClick={submitChangePassword}
                  className="rounded-md bg-zinc-800 px-5 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-60"
                >
                  {savingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                </button>
                {passwordNotice ? (
                  <div
                    className={cn(
                      "rounded-md px-3 py-2 text-sm",
                      passwordNotice.type === "ok"
                        ? "border border-green-200 bg-green-50 text-green-800"
                        : "border border-red-200 bg-red-50 text-red-800",
                    )}
                  >
                    {passwordNotice.text}
                  </div>
                ) : null}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
