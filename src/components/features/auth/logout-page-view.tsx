"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { login, register } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const BTN_TEAL = "bg-[#A8DADC]";

type Tab = "login" | "register";

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
      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800"
      aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
    >
      {show ? (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ) : (
        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
        </svg>
      )}
    </button>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

function GoogleButton({ next, label }: { next: string; label: string }) {
  return (
    <a
      href={`/api/auth/google?next=${encodeURIComponent(next)}`}
      className="flex w-full items-center justify-center gap-2.5 rounded-md border border-zinc-300 bg-white px-4 py-2.5 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 active:bg-zinc-100"
    >
      <GoogleIcon />
      {label}
    </a>
  );
}

function Divider() {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="h-px flex-1 bg-zinc-200" />
      <span className="text-xs text-zinc-400">hoặc</span>
      <div className="h-px flex-1 bg-zinc-200" />
    </div>
  );
}

function Alert({ type, children }: { type: "error" | "success"; children: React.ReactNode }) {
  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-800"
      : "border-emerald-200 bg-emerald-50 text-emerald-900";
  return (
    <p className={`rounded-md border px-3 py-2 text-sm ${styles}`} role={type === "error" ? "alert" : "status"}>
      {children}
    </p>
  );
}

function InputField({
  id, label, type = "text", value, onChange, disabled, autoComplete, required,
}: {
  id: string; label: string; type?: string; value: string;
  onChange: (v: string) => void; disabled: boolean; autoComplete?: string; required?: boolean;
}) {
  const [showPw, setShowPw] = useState(false);
  const isPassword = type === "password";
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-zinc-800">
        {label}{required && <span className="ml-0.5 text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={id}
          name={id}
          type={isPassword ? (showPw ? "text" : "password") : type}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={`w-full rounded-md border border-zinc-300 bg-white py-2.5 text-sm text-zinc-900 focus:border-teal-600 focus:outline-none disabled:opacity-60 ${isPassword ? "pl-3 pr-11" : "px-3"}`}
        />
        {isPassword && <EyeToggle show={showPw} onToggle={() => setShowPw((v) => !v)} />}
      </div>
    </div>
  );
}

function LoginForm({ nextPath, onSuccess }: { nextPath: string; onSuccess: () => void }) {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login({ username, password });
      router.push(postLoginPath(nextPath));
      router.refresh();
      onSuccess();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Lỗi mạng. Thử lại sau.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <Alert type="error">{error}</Alert>}
      <InputField id="auth-username" label="Tên người dùng hoặc email" value={username} onChange={setUsername} disabled={loading} autoComplete="username" required />
      <InputField id="auth-password" label="Mật khẩu" type="password" value={password} onChange={setPassword} disabled={loading} autoComplete="current-password" required />
      <button
        type="submit"
        disabled={loading}
        className={`w-full rounded-md ${BTN_TEAL} py-2.5 text-sm font-semibold text-zinc-900 transition hover:opacity-90 disabled:opacity-60`}
      >
        {loading ? "Đang đăng nhập…" : "Đăng nhập"}
      </button>
    </form>
  );
}

function RegisterForm({ nextPath, onRegistered }: { nextPath: string; onRegistered: (autoLogin: boolean) => void }) {
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
    <form className="space-y-4" onSubmit={handleSubmit}>
      {error && <Alert type="error">{error}</Alert>}
      <InputField id="reg-email" label="Địa chỉ email" type="email" value={email} onChange={setEmail} disabled={loading} autoComplete="email" required />
      <InputField id="reg-username" label="Tên người dùng" value={username} onChange={setUsername} disabled={loading} autoComplete="username" required />
      <InputField id="reg-password" label="Mật khẩu" type="password" value={password} onChange={setPassword} disabled={loading} autoComplete="new-password" required />
      <InputField id="reg-confirm" label="Xác nhận mật khẩu" type="password" value={confirmPassword} onChange={setConfirmPassword} disabled={loading} autoComplete="new-password" required />
      <button
        type="submit"
        disabled={loading}
        className={`w-full rounded-md ${BTN_TEAL} py-2.5 text-sm font-semibold text-zinc-900 transition hover:opacity-90 disabled:opacity-60`}
      >
        {loading ? "Đang tạo tài khoản…" : "Tạo tài khoản"}
      </button>
    </form>
  );
}

function LogoutPageViewInner() {
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/";
  const googleError = searchParams.get("error");

  const [tab, setTab] = useState<Tab>("login");
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const googleErrorMsg: Record<string, string> = {
    google_cancelled: "Bạn đã huỷ đăng nhập Google.",
    google_token: "Không thể xác thực tài khoản Google. Thử lại.",
    google_login: "Đăng nhập Google thất bại. Thử lại hoặc dùng tài khoản thường.",
    config: "Tính năng đăng nhập Google chưa được cấu hình.",
  };

  return (
    <div className="relative flex min-h-0 flex-1 flex-col bg-white">
      <Link
        href="#"
        className="absolute right-4 top-4 z-10 text-sm text-zinc-500 hover:text-zinc-800 sm:right-8 sm:top-5"
      >
        Tiếng Việt
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:py-20">
        <div className="w-full max-w-md border border-zinc-200 bg-white px-8 py-10 sm:px-10 sm:py-12">
          <div className="mb-7 flex justify-center">
            <Image src="/logo-1.png" alt="CONFIGGS DNS Logo" width={280} height={80} className="h-14 w-auto object-contain sm:h-16" priority />
          </div>

          {/* Tabs */}
          <div className="mb-6 flex overflow-hidden rounded-md border border-zinc-200">
            {(["login", "register"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setTab(t); setRegisterSuccess(false); }}
                className={`flex-1 py-2 text-sm font-medium transition ${tab === t ? `${BTN_TEAL} text-zinc-900` : "bg-white text-zinc-500 hover:bg-zinc-50"}`}
              >
                {t === "login" ? "Đăng nhập" : "Đăng ký"}
              </button>
            ))}
          </div>

          {/* Google error */}
          {googleError && googleErrorMsg[googleError] && (
            <div className="mb-4">
              <Alert type="error">{googleErrorMsg[googleError]}</Alert>
            </div>
          )}

          {/* Register success (no auto-login) */}
          {registerSuccess && (
            <div className="mb-4">
              <Alert type="success">Tạo tài khoản thành công! Vui lòng đăng nhập.</Alert>
            </div>
          )}

          {/* Google button */}
          <div className="space-y-3">
            <GoogleButton
              next={nextPath}
              label={tab === "login" ? "Đăng nhập với Google" : "Đăng ký với Google"}
            />
          </div>

          <Divider />

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

          {/* Footer links */}
          <div className="mt-5 flex items-center justify-between text-sm text-zinc-500">
            {tab === "login" ? (
              <>
                <button type="button" onClick={() => setTab("register")} className="underline-offset-2 hover:text-zinc-800 hover:underline">
                  Tạo tài khoản mới
                </button>
                <Link href="/forgot-password" className="underline-offset-2 hover:text-zinc-800 hover:underline">
                  Quên mật khẩu?
                </Link>
              </>
            ) : (
              <button type="button" onClick={() => setTab("login")} className="underline-offset-2 hover:text-zinc-800 hover:underline">
                Đã có tài khoản? Đăng nhập
              </button>
            )}
          </div>
        </div>
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
    <div className="relative flex min-h-0 flex-1 flex-col bg-white">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:py-20">
        <div className="w-full max-w-md border border-zinc-200 bg-white px-8 py-10 sm:px-10 sm:py-12">
          <p className="text-center text-sm text-zinc-500">Đang tải…</p>
        </div>
      </div>
    </div>
  );
}
