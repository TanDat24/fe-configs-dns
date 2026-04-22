"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { forgotPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const BTN_TEAL = "bg-[#A8DADC]";

function Alert({ type, children }: { type: "error" | "success"; children: React.ReactNode }) {
  const styles =
    type === "error"
      ? "border-red-200 bg-red-50 text-red-700"
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

export function ForgotPasswordPageView() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setLoading(true);
    try {
      const { message } = await forgotPassword({ email });
      setSuccessMessage(message);
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
            Quên mật khẩu
          </h1>
          <p className="mb-5 text-center text-xs text-zinc-500">
            Nhập email hoặc tên người dùng để nhận hướng dẫn khôi phục
          </p>

          <form className="space-y-3" onSubmit={handleSubmit}>
            {error && <Alert type="error">{error}</Alert>}
            {successMessage && <Alert type="success">{successMessage}</Alert>}

            <div>
              <input
                id="forgot-email"
                name="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                disabled={loading}
                placeholder="Tên người dùng hoặc email"
                className="h-10 w-full rounded-md border border-zinc-200 bg-white px-3 text-sm text-zinc-900 placeholder:text-zinc-400 transition focus:border-teal-500 focus:outline-none focus:ring-2 focus:ring-teal-500/10 disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`h-10 w-full rounded-md ${BTN_TEAL} text-sm font-semibold text-zinc-900 transition hover:opacity-90 disabled:opacity-60`}
            >
              {loading ? "Đang gửi…" : "Lấy mật khẩu mới"}
            </button>
          </form>

          <div className="mt-5 flex items-center justify-center text-xs text-zinc-500">
            <Link
              href="/logout"
              className="underline-offset-2 hover:text-zinc-800 hover:underline"
            >
              ← Quay lại đăng nhập
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-[11px] text-zinc-400">
          &copy; {new Date().getFullYear()} CONFIGGS DNS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
