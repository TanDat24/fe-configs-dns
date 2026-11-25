"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  getEmailVerificationStatus,
  sendEmailVerificationCode,
  verifyEmailVerificationCode,
} from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import type { EmailVerificationStatusDto } from "@/lib/contracts/api";

type EmailVerificationPanelProps = {
  onStatusChange?: (status: EmailVerificationStatusDto | null) => void;
};

export function EmailVerificationPanel({ onStatusChange }: EmailVerificationPanelProps = {}) {
  const [status, setStatus] = useState<EmailVerificationStatusDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<"send" | "verify" | null>(null);
  const [expiredSession, setExpiredSession] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [retryAt, setRetryAt] = useState(0);
  const [now, setNow] = useState(0);
  const inFlight = useRef(false);
  const mounted = useRef(false);

  const reportError = useCallback((err: unknown) => {
    if (!mounted.current) return;
    if (err instanceof ApiError && err.status === 401) setExpiredSession(true);
    setError(err instanceof ApiError && (err.status === 0 || err.status >= 500)
      ? "Chưa xác nhận được kết quả. Hãy kiểm tra hộp thư và tải lại trạng thái trước khi thử lại."
      : err instanceof Error ? err.message : "Không thể xử lý yêu cầu. Vui lòng thử lại sau.");
  }, []);

  const refreshStatus = useCallback(async (signal?: AbortSignal) => {
    try {
      const next = await getEmailVerificationStatus(signal);
      if (signal?.aborted || !mounted.current) return next;
      setStatus(next);
      onStatusChange?.(next);
      const timestamp = Date.now();
      setNow(timestamp);
      setRetryAt(timestamp + next.retryAfterSec * 1000);
      if (!next.pending) setCode("");
      return next;
    } catch (err) {
      if (!signal?.aborted && mounted.current) onStatusChange?.(null);
      throw err;
    }
  }, [onStatusChange]);

  useEffect(() => {
    mounted.current = true;
    const controller = new AbortController();
    void refreshStatus(controller.signal)
      .catch(err => { if (!controller.signal.aborted) reportError(err); })
      .finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => { mounted.current = false; controller.abort(); };
  }, [refreshStatus, reportError]);

  useEffect(() => {
    if (retryAt <= Date.now()) return;
    const timer = setInterval(() => {
      const timestamp = Date.now();
      setNow(timestamp);
      if (timestamp >= retryAt) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [retryAt]);

  const reload = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true); setError(""); setMessage("");
    try { await refreshStatus(); } catch (err) {
      if (mounted.current) setStatus(null);
      reportError(err);
    }
    finally {
      inFlight.current = false;
      if (mounted.current) setLoading(false);
    }
  };

  const perform = async (operation: "send" | "verify") => {
    if (inFlight.current || !status || expiredSession) return;
    inFlight.current = true;
    setBusy(operation); setError(""); setMessage("");
    try {
      if (operation === "send") {
        await sendEmailVerificationCode({ email: status.email });
        if (mounted.current) {
          setCode("");
          setMessage("Đã gửi yêu cầu gửi mã. Kiểm tra hộp thư và thư rác; mã có hiệu lực 5 phút.");
        }
      } else {
        await verifyEmailVerificationCode({ code });
        if (mounted.current) setMessage("Email đã được xác minh.");
      }
    } catch (err) {
      reportError(err);
    } finally {
      // Reconcile even after a lost response: WordPress may already have completed the action.
      try {
        const latest = await refreshStatus();
        if (mounted.current && latest.verified) {
          setError(""); setMessage("Email đã được xác minh.");
        }
      } catch (err) {
        if (mounted.current) setStatus(null);
        reportError(err);
      }
      inFlight.current = false;
      if (mounted.current) setBusy(null);
    }
  };

  const remaining = Math.max(0, Math.ceil((retryAt - now) / 1000));
  return (
    <section id="email-verification" tabIndex={-1} aria-labelledby="email-verification-heading" className="mt-5 scroll-mt-6 rounded-lg border border-zinc-200 bg-white p-4">
      <h2 id="email-verification-heading" className="font-medium">Xác minh email tài khoản</h2>
      <p className="mt-2 text-sm text-zinc-600">Xác nhận anh/chị có quyền truy cập email đang lưu trên tài khoản.</p>
      {loading ? <p role="status" className="mt-3 text-sm text-zinc-600">Đang tải trạng thái email…</p> : expiredSession ? (
        <p className="mt-3 text-sm text-zinc-700">
          Phiên đăng nhập đã hết hạn. <Link className="underline" href="/logout?next=%2Fdashboard%23email-verification">Đăng nhập lại</Link> để tiếp tục.
        </p>
      ) : status ? (
        <div className="mt-3 space-y-3 text-sm">
          <p>Email hiện tại: <strong className="break-all">{status.email || "Chưa có email"}</strong></p>
          {status.verified ? (
            <p role="status" className="text-emerald-700">Email này đã được xác minh.</p>
          ) : !status.canVerify ? (
            <p className="text-amber-800">Tài khoản chưa có email thật hợp lệ để nhận mã. Vui lòng liên hệ hỗ trợ để cập nhật email trước khi xác minh.</p>
          ) : (
            <>
              <p className="text-zinc-600">Email này chưa được xác minh. Khi gửi lại, chỉ mã mới nhất có hiệu lực.</p>
              <button type="button" disabled={busy !== null || remaining > 0} onClick={() => void perform("send")}
                className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50">
                {busy === "send" ? "Đang gửi…" : `${status.pending ? "Gửi lại mã" : "Gửi mã xác minh"}${remaining > 0 ? ` (${remaining}s)` : ""}`}
              </button>
              {status.pending && (
                <form className="flex max-w-md flex-wrap items-end gap-3" onSubmit={event => { event.preventDefault(); void perform("verify"); }}>
                  <div>
                    <label htmlFor="email-verification-code" className="block font-medium">Mã xác minh (6 chữ số)</label>
                    <input id="email-verification-code" type="text" inputMode="numeric" autoComplete="one-time-code"
                      pattern="[0-9]{6}" maxLength={6} required value={code} disabled={busy !== null}
                      onChange={event => setCode(event.target.value.replace(/\D/g, ""))}
                      className="mt-1 w-40 rounded-md border border-zinc-300 px-3 py-2 tracking-widest" />
                  </div>
                  <button type="submit" disabled={busy !== null || !/^[0-9]{6}$/.test(code)}
                    className="rounded-md bg-zinc-900 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-50">
                    {busy === "verify" ? "Đang xác nhận…" : "Xác nhận mã"}
                  </button>
                </form>
              )}
            </>
          )}
        </div>
      ) : null}
      {message && <p role="status" className="mt-3 text-sm text-emerald-700">{message}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-700">{error}</p>}
      {!loading && !expiredSession && (
        <button type="button" disabled={busy !== null} onClick={() => void reload()}
          className="mt-3 text-sm text-zinc-700 underline underline-offset-2 disabled:opacity-50">Tải lại trạng thái</button>
      )}
    </section>
  );
}
