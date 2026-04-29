"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useState, type FormEvent } from "react";
import { login, loginByDomain, register } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const BTN_TEAL = "bg-[#A8DADC]";

type Tab = "login" | "register";
type LoginMode = "account" | "domain";
const DOMAIN_MAX_FAILED_ATTEMPTS = 3;
const DOMAIN_LOCK_MS = 30_000;

function postLoginPath(nextParam: string | null): string {
  if (!nextParam) return "/";
  const n = nextParam.trim();
  if (!n.startsWith("/") || n.startsWith("//") || n.includes("\\")) return "/";
  return n;
}

function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-700"
      aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
    >
      {show ? (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ) : (
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      )}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function ZaloIcon() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 48 48" aria-hidden>
      <path
        fill="#0068FF"
        d="M24 4C12.954 4 4 12.278 4 22.5c0 5.56 2.63 10.57 6.85 14.02-.17 1.33-.66 3.45-1.74 5.28-.3.5.17 1.17.74 1.03 3.08-.78 6.2-2.43 8.07-3.6 1.95.5 4 .77 6.08.77 11.046 0 20-8.28 20-18.5S35.046 4 24 4z"
      />
      <path
        fill="#fff"
        d="M15.6 16.5c.6 0 1 .4 1 1v8.9h4.8c.6 0 1 .4 1 1s-.4 1-1 1h-5.8c-.6 0-1-.4-1-1V17.5c0-.6.4-1 1-1zm10.8 2.8c.6 0 1 .4 1 1v6.3c0 .6-.4 1-1 1s-1-.4-1-1v-6.3c0-.6.4-1 1-1zm.7-3c.5 0 .9.4.9.9s-.4.9-.9.9h-1.4c-.5 0-.9-.4-.9-.9s.4-.9.9-.9h1.4zm6.4 2.9c2.14 0 3.9 1.8 3.9 4s-1.76 4-3.9 4c-.85 0-1.64-.28-2.28-.76-.18.44-.6.76-1.1.76-.6 0-1.07-.5-1.07-1.1v-5.8c0-.6.47-1.1 1.07-1.1.5 0 .92.32 1.1.76.64-.48 1.43-.76 2.28-.76zm0 1.9c-1.13 0-2.06.95-2.06 2.1s.93 2.1 2.06 2.1 2.06-.95 2.06-2.1-.93-2.1-2.06-2.1z"
      />
    </svg>
  );
}

function SocialButton({
  href,
  icon,
  label,
  brand,
  disabled = false,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  brand?: "google" | "zalo";
  disabled?: boolean;
}) {
  return (
    <a
      href={href}
      aria-disabled={disabled}
      onClick={(e) => {
        if (disabled) e.preventDefault();
      }}
      className={`flex h-10 items-center justify-center gap-2 rounded-md border text-xs font-medium transition ${
        brand === "zalo"
          ? "border-[#0068FF]/20 bg-[#0068FF]/5 text-[#0068FF] hover:bg-[#0068FF]/10"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50"
      } ${disabled ? "pointer-events-none cursor-not-allowed opacity-50" : "active:scale-[0.98]"}`}
    >
      {icon}
      <span>{label}</span>
    </a>
  );
}

function Alert({ type, children }: { type: "error" | "success" | "warning"; children: React.ReactNode }) {
  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
      : type === "warning"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : "border-emerald-200 bg-emerald-50 text-emerald-800";
  return (
    <p
      className={`rounded-md border px-3 py-2 text-[13px] ${styles}`}
      role={type === "error" ? "alert" : "status"}
    >
      {children}
    </p>
  );
}

function Field({
  id,
  label,
  type = "text",
  value,
  onChange,
  disabled,
  autoComplete,
  placeholder,
}: {
  id: string;
  label?: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  disabled: boolean;
  autoComplete?: string;
  placeholder?: string;
}) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      {label && (
        <label htmlFor={id} className="mb-1 block text-xs font-medium text-zinc-600">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={id}
          type={isPassword ? (showPw ? "text" : "password") : type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          className={`h-10 w-full rounded-md border border-zinc-200 bg-white text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10 disabled:opacity-60 ${
            isPassword ? "pl-3 pr-10" : "px-3"
          }`}
        />
        {isPassword && <EyeToggle show={showPw} onToggle={() => setShowPw((v) => !v)} />}
      </div>
    </div>
  );
}

function LoginModeToggle({
  mode,
  onChange,
  disabled,
}: {
  mode: LoginMode;
  onChange: (m: LoginMode) => void;
  disabled: boolean;
}) {
  const modes: Array<{ id: LoginMode; label: string }> = [
    { id: "domain", label: "Tên miền" },
    { id: "account", label: "Tài khoản" },
  ];
  return (
    <div className="flex gap-1 rounded-md bg-zinc-100 p-1">
      {modes.map((m) => (
        <button
          key={m.id}
          type="button"
          disabled={disabled}
          onClick={() => onChange(m.id)}
          className={`flex-1 rounded py-1.5 text-xs font-medium transition ${
            mode === m.id
              ? "bg-orange-500 text-white shadow-sm"
              : "text-zinc-500 hover:text-zinc-700"
          } disabled:opacity-60`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function LoginForm({ nextPath, onSuccess }: { nextPath: string; onSuccess: () => void }) {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>("domain");
  const [username, setUsername] = useState("");
  const [domain, setDomain] = useState("");
  const [password, setPassword] = useState("");
  const [domainChecked, setDomainChecked] = useState(false);
  const [domainWrongAttempts, setDomainWrongAttempts] = useState(0);
  const [domainLockUntil, setDomainLockUntil] = useState<number | null>(null);
  const [lockTick, setLockTick] = useState(Date.now());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const lockRemainingSec = useMemo(() => {
    if (!domainLockUntil) return 0;
    return Math.max(0, Math.ceil((domainLockUntil - lockTick) / 1000));
  }, [domainLockUntil, lockTick]);

  const isDomainLocked = mode === "domain" && lockRemainingSec > 0;
  const shouldShowForgotDomain =
    mode === "domain" &&
    domainChecked &&
    (domainWrongAttempts >= DOMAIN_MAX_FAILED_ATTEMPTS || isDomainLocked);

  useEffect(() => {
    if (!domainLockUntil) return;
    if (Date.now() >= domainLockUntil) {
      setDomainLockUntil(null);
      setDomainWrongAttempts(0);
      return;
    }
    const timer = window.setInterval(() => {
      setLockTick(Date.now());
      if (Date.now() >= domainLockUntil) {
        setDomainLockUntil(null);
        setDomainWrongAttempts(0);
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [domainLockUntil]);

  function isWrongDomainPasswordError(message: string): boolean {
    return /(mat khau|mật khẩu|password).*(sai|khong dung|không đúng|invalid|incorrect|wrong)/i.test(
      message,
    );
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (isDomainLocked) {
      setError(`Ban thu lai sau ${lockRemainingSec} giay.`);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      if (mode === "domain") {
        if (!domainChecked) {
          await loginByDomain({ domain });
          setDomainChecked(true);
          return;
        }
        const result = await loginByDomain({ domain, password });
        if (!result.authToken) {
          throw new ApiError("Không nhận được token.", 500, result);
        }
        setDomainWrongAttempts(0);
        setDomainLockUntil(null);
      } else {
        await login({ username, password });
      }
      router.push(postLoginPath(nextPath));
      router.refresh();
      onSuccess();
    } catch (err) {
      const message = err instanceof ApiError ? err.message : "Lỗi mạng. Thử lại sau.";
      if (mode === "domain" && domainChecked && err instanceof ApiError && isWrongDomainPasswordError(message)) {
        const nextAttempts = domainWrongAttempts + 1;
        setDomainWrongAttempts(nextAttempts);
        if (nextAttempts >= DOMAIN_MAX_FAILED_ATTEMPTS) {
          const lockTo = Date.now() + DOMAIN_LOCK_MS;
          setDomainLockUntil(lockTo);
          setLockTick(Date.now());
          setError("Ban nhap sai mat khau qua 3 lan. Vui long thu lai sau 30 giay.");
        } else {
          setError(message);
        }
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  }

  function handleModeChange(next: LoginMode) {
    if (next === mode) return;
    setMode(next);
    setError(null);
    setPassword("");
    setDomainChecked(false);
    setDomainWrongAttempts(0);
    setDomainLockUntil(null);
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <LoginModeToggle mode={mode} onChange={handleModeChange} disabled={loading} />
      {error && <Alert type="error">{error}</Alert>}
      {mode === "account" ? (
        <Field
          id="auth-username"
          value={username}
          onChange={setUsername}
          disabled={loading}
          autoComplete="username"
          placeholder="Tên người dùng hoặc email"
        />
      ) : (
        <Field
          id="auth-domain"
          value={domain}
          onChange={(value) => {
            setDomain(value);
            setDomainChecked(false);
            setPassword("");
            setError(null);
            setDomainWrongAttempts(0);
            setDomainLockUntil(null);
          }}
          disabled={loading}
          autoComplete="off"
          placeholder="example.com"
        />
      )}
      {(mode === "account" || domainChecked) && (
        <Field
          id="auth-password"
          type="password"
          value={password}
          onChange={setPassword}
          disabled={loading}
          autoComplete="current-password"
          placeholder="Mật khẩu"
        />
      )}
      {shouldShowForgotDomain && (
        <div className="text-right text-xs">
          <Link
            href="/forgot-password-domain"
            className="text-orange-600 underline underline-offset-2 hover:text-orange-700"
          >
            Bạn quên mật khẩu tên miền?
          </Link>
        </div>
      )}
      <button
        type="submit"
        disabled={loading || isDomainLocked}
        className={`h-10 w-full rounded-md ${BTN_TEAL} text-sm font-semibold text-zinc-900 transition hover:opacity-90 disabled:opacity-60`}
      >
        {loading
          ? "Đang xử lý…"
          : isDomainLocked
            ? `Thu lai sau ${lockRemainingSec}s`
            : mode === "domain" && !domainChecked
              ? "Tiếp tục"
              : "Đăng nhập"}
      </button>
    </form>
  );
}

function RegisterForm({
  nextPath,
  onRegistered,
}: {
  nextPath: string;
  onRegistered: (autoLogin: boolean) => void;
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp.");
      return;
    }
    setLoading(true);
    try {
      const result = await register({ username, email, password, confirmPassword });
      const autoLogin = !!result.authToken;
      if (autoLogin) {
        router.push(postLoginPath(nextPath));
        router.refresh();
      }
      onRegistered(autoLogin);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Lỗi mạng. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      {error && <Alert type="error">{error}</Alert>}
      <Field
        id="reg-email"
        type="email"
        value={email}
        onChange={setEmail}
        disabled={loading}
        autoComplete="email"
        placeholder="Email"
      />
      <Field
        id="reg-username"
        value={username}
        onChange={setUsername}
        disabled={loading}
        autoComplete="username"
        placeholder="Tên người dùng"
      />
      <Field
        id="reg-password"
        type="password"
        value={password}
        onChange={setPassword}
        disabled={loading}
        autoComplete="new-password"
        placeholder="Mật khẩu"
      />
      <Field
        id="reg-confirm"
        type="password"
        value={confirmPassword}
        onChange={setConfirmPassword}
        disabled={loading}
        autoComplete="new-password"
        placeholder="Xác nhận mật khẩu"
      />
      <button
        type="submit"
        disabled={loading}
        className={`h-10 w-full rounded-md ${BTN_TEAL} text-sm font-semibold text-zinc-900 transition hover:opacity-90 disabled:opacity-60`}
      >
        {loading ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
      </button>
    </form>
  );
}

function LogoutPageViewInner() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";
  const oauthError = searchParams.get("error");
  const consentProvider = searchParams.get("consent_provider");

  const [tab, setTab] = useState<Tab>("login");
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [allowSaveThirdPartyInfo, setAllowSaveThirdPartyInfo] = useState(false);
  const needsGoogleConsent = consentProvider === "google";
  const needsZaloConsent = consentProvider === "zalo";
  const needsConsent = needsGoogleConsent || needsZaloConsent;

  const oauthErrorMsg: Record<string, string> = {
    google_cancelled: "Bạn đã huỷ đăng nhập Google.",
    google_token: "Không thể xác thực tài khoản Google. Thử lại.",
    google_login: "Đăng nhập Google thất bại. Thử lại hoặc dùng tài khoản thường.",
    google_config: "Tính năng đăng nhập Google chưa được cấu hình.",
    zalo_cancelled: "Bạn đã huỷ đăng nhập Zalo.",
    zalo_token: "Không thể xác thực tài khoản Zalo. Thử lại.",
    zalo_login: "Đăng nhập Zalo thất bại. Thử lại hoặc dùng tài khoản thường.",
    zalo_config: "Tính năng đăng nhập Zalo chưa được cấu hình.",
    consent_required_google: "Tài khoản Google này chưa có trong hệ thống. Vui lòng đồng ý lưu thông tin để tiếp tục.",
    consent_required_zalo: "Tài khoản Zalo này chưa có trong hệ thống. Vui lòng đồng ý lưu thông tin để tiếp tục.",
    config: "Tính năng đăng nhập bên thứ ba chưa được cấu hình.",
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-gradient-to-b from-zinc-50 to-white">
      <Link
        href="#"
        className="absolute right-4 top-4 z-10 text-xs text-zinc-500 hover:text-zinc-800 sm:right-6 sm:top-5"
      >
        Tiếng Việt
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-10 sm:py-14">
        <div className="w-full max-w-[380px] rounded-xl border border-zinc-200/80 bg-white px-7 py-8 shadow-sm sm:px-8 sm:py-9">
          <div className="mb-5 flex justify-center">
            <Image
              src="/logo-1.png"
              alt="CONFIGGS DNS"
              width={280}
              height={80}
              className="h-14 w-auto object-contain sm:h-16"
              priority
            />
          </div>

          <h1 className="mb-1 text-center text-lg font-semibold text-zinc-900">
            {tab === "login" ? "Chào mừng trở lại" : "Tạo tài khoản mới"}
          </h1>
          <p className="mb-5 text-center text-xs text-zinc-500">
            {tab === "login"
              ? "Đăng nhập để quản lý tên miền của bạn"
              : "Đăng ký miễn phí chỉ trong vài giây"}
          </p>

          {oauthError && oauthErrorMsg[oauthError] && (
            <div className="mb-3">
              <Alert type={oauthError.startsWith("consent_required_") ? "warning" : "error"}>
                {oauthErrorMsg[oauthError]}
              </Alert>
            </div>
          )}

          {registerSuccess && (
            <div className="mb-3">
              <Alert type="success">Tạo tài khoản thành công! Vui lòng đăng nhập.</Alert>
            </div>
          )}

          {tab === "login" ? (
            <LoginForm nextPath={nextPath} onSuccess={() => {}} />
          ) : (
            <RegisterForm
              nextPath={nextPath}
              onRegistered={(autoLogin) => {
                if (!autoLogin) {
                  setRegisterSuccess(true);
                  setTab("login");
                }
              }}
            />
          )}

          <div className="my-4 flex items-center gap-3">
            <div className="h-px flex-1 bg-zinc-200" />
            <span className="text-[11px] uppercase tracking-wider text-zinc-400">
              Hoặc tiếp tục với
            </span>
            <div className="h-px flex-1 bg-zinc-200" />
          </div>

          {needsConsent && (
            <label className="mb-3 flex items-start gap-2 text-[12px] text-zinc-600">
              <input
                type="checkbox"
                checked={allowSaveThirdPartyInfo}
                onChange={(e) => setAllowSaveThirdPartyInfo(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-zinc-300 text-orange-500 focus:ring-orange-500"
              />
              <span>
                Tôi đồng ý{" "}
                <Link
                  href="/service-policy"
                  target="_blank"
                  className="text-blue-600 underline underline-offset-2 hover:text-blue-700"
                >
                  lưu và xử lý thông tin cá nhân
                </Link>{" "}
                {needsGoogleConsent
                  ? "từ Google để đăng nhập"
                  : needsZaloConsent
                    ? "từ Zalo để đăng nhập"
                    : "từ Google/Zalo để đăng nhập"}
              </span>
            </label>
          )}

          <div className="grid grid-cols-2 gap-2">
            <SocialButton
              href={`/api/auth/google?next=${encodeURIComponent(nextPath)}${
                needsGoogleConsent && allowSaveThirdPartyInfo ? "&consent=1" : ""
              }`}
              icon={<GoogleIcon />}
              label="Google"
              disabled={needsGoogleConsent && !allowSaveThirdPartyInfo}
            />
            <SocialButton
              href={`/api/auth/zalo?next=${encodeURIComponent(nextPath)}${
                needsZaloConsent && allowSaveThirdPartyInfo ? "&consent=1" : ""
              }`}
              icon={<ZaloIcon />}
              label="Zalo"
              brand="zalo"
              disabled={needsZaloConsent && !allowSaveThirdPartyInfo}
            />
          </div>

          <div className="mt-5 flex items-center justify-between text-xs text-zinc-500">
            {tab === "login" ? (
              <>
                <button
                  type="button"
                  onClick={() => setTab("register")}
                  className="underline-offset-2 hover:text-zinc-800 hover:underline"
                >
                  Tạo tài khoản mới
                </button>
                <Link
                  href="/forgot-password"
                  className="underline-offset-2 hover:text-zinc-800 hover:underline"
                >
                  Quên mật khẩu?
                </Link>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setTab("login")}
                className="mx-auto underline-offset-2 hover:text-zinc-800 hover:underline"
              >
                Đã có tài khoản? Đăng nhập
              </button>
            )}
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-zinc-400">
          &copy; {new Date().getFullYear()} CONFIGGS DNS. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export function LogoutPageView() {
  return (
    <Suspense fallback={<LogoutPageViewFallback />}>
      <LogoutPageViewInner />
    </Suspense>
  );
}

function LogoutPageViewFallback() {
  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-gradient-to-b from-zinc-50 to-white">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-14">
        <div className="w-full max-w-[380px] rounded-xl border border-zinc-200/80 bg-white px-8 py-9 shadow-sm">
          <p className="text-center text-sm text-zinc-500">Đang tải…</p>
        </div>
      </div>
    </div>
  );
}
