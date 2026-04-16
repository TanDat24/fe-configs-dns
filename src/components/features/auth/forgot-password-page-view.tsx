"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, type FormEvent } from "react";
import { forgotPassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";

const BTN_TEAL = "bg-[#A8DADC]";

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
    <div className="relative flex min-h-0 flex-1 flex-col bg-zinc-100">
      <Link
        href="#"
        className="absolute right-4 top-4 z-10 text-sm text-zinc-500 hover:text-zinc-800 sm:right-8 sm:top-5"
      >
        Tiếng Việt
      </Link>

      <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 sm:py-20">
        <div className="w-full max-w-md border border-zinc-200 bg-white px-8 py-10 sm:px-10 sm:py-12">
          <div className="mb-6 flex justify-center">
            <Image
              src="/logo-1.png"
              alt="CONFIGGS DNS Logo"
              width={280}
              height={80}
              className="h-14 w-auto object-contain sm:h-16"
              priority
            />
          </div>

          <div className="mb-6 border-l-4 border-sky-400 bg-sky-50/50 py-3 pl-4 pr-2 text-sm leading-relaxed text-zinc-700">
            Vui lòng điền tên người dùng hoặc địa chỉ email của bạn. Bạn sẽ nhận
            được một email với hướng dẫn khôi phục mật khẩu.
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
            {successMessage ? (
              <p
                className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900"
                role="status"
              >
                {successMessage}
              </p>
            ) : null}

            <div>
              <label
                htmlFor="forgot-email"
                className="mb-1.5 block text-sm font-medium text-zinc-800"
              >
                Tên người dùng hoặc địa chỉ email
              </label>
              <input
                id="forgot-email"
                name="email"
                type="text"
                autoComplete="username"
                value={email}
                onChange={(ev) => setEmail(ev.target.value)}
                disabled={loading}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 focus:border-teal-600 focus:outline-none disabled:opacity-60"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full rounded-md ${BTN_TEAL} py-2.5 text-sm font-semibold text-zinc-900 transition hover:opacity-90 disabled:opacity-60`}
            >
              {loading ? "Đang gửi…" : "Lấy mật khẩu mới"}
            </button>
          </form>

          <div className="mt-6 text-right">
            <Link
              href="/logout"
              className="text-sm text-zinc-500 underline-offset-2 hover:text-zinc-800 hover:underline"
            >
              Đăng nhập
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
