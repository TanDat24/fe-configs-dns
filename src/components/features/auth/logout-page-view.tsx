"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState, type FormEvent } from "react";
import { login } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

function postLoginPath(nextParam: string | null): string {
  if (!nextParam) return "/";
  const n = nextParam.trim();
  if (!n.startsWith("/") || n.startsWith("//") || n.includes("\\")) return "/";
  return n;
}

const BTN_TEAL = "bg-[#A8DADC]";

function EyeToggle({
  show,
  onToggle,
}: {
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-800"
      aria-label={show ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
    >
      {show ? (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      ) : (
        <svg
          className="h-5 w-5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
          />
        </svg>
      )}
    </button>
  );
}

function LogoutPageViewInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showPassword, setShowPassword] = useState(false);
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
      router.push(postLoginPath(searchParams.get("next")));
      router.refresh();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Lỗi mạng. Thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  }

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
          <div className="mb-8 flex justify-center">
            <Image
              src="/logo-1.png"
              alt="CONFIGGS DNS Logo"
              width={280}
              height={80}
              className="h-14 w-auto object-contain sm:h-16"
              priority
            />
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {error ? (
              <p
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
                role="alert"
              >
                {error}
              </p>
            ) : null}

            <div>
              <label
                htmlFor="auth-username"
                className="mb-1.5 block text-sm font-medium text-zinc-800"
              >
                Tên người dùng hoặc địa chỉ email
              </label>
              <input
                id="auth-username"
                name="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(ev) => setUsername(ev.target.value)}
                disabled={loading}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-teal-600 focus:outline-none disabled:opacity-60"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="mb-1.5 block text-sm font-medium text-zinc-800"
              >
                Mật khẩu
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(ev) => setPassword(ev.target.value)}
                  disabled={loading}
                  className="w-full rounded-md border border-zinc-300 bg-white py-2.5 pl-3 pr-11 text-sm text-zinc-900 focus:border-teal-600 focus:outline-none disabled:opacity-60"
                />
                <EyeToggle
                  show={showPassword}
                  onToggle={() => setShowPassword((v) => !v)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-md ${BTN_TEAL} py-2.5 text-sm font-semibold text-zinc-900 transition hover:opacity-90 disabled:opacity-60`}
            >
              {loading ? "Đang đăng nhập…" : "Đăng nhập"}
            </button>
          </form>

          <div className="mt-6 text-right">
            <Link
              href="/forgot-password"
              className="text-sm text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
            >
              Bạn quên mật khẩu?
            </Link>
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
