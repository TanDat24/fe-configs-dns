"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getMyCccdStatus, uploadMyCccd } from "@/lib/api/auth";
import { useRouter } from "next/navigation";

const MAX_UPLOAD_MB = 5;

export default function UploadCccdPage() {
  const router = useRouter();
  const [frontFile, setFrontFile] = useState<File | null>(null);
  const [backFile, setBackFile] = useState<File | null>(null);
  const [frontPreviewUrl, setFrontPreviewUrl] = useState<string | null>(null);
  const [backPreviewUrl, setBackPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [frontFileUrl, setFrontFileUrl] = useState<string | null>(null);
  const [backFileUrl, setBackFileUrl] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [uploadLocked, setUploadLocked] = useState(false);
  const [lockMessage, setLockMessage] = useState<string | null>(null);

  useEffect(() => {
    let canceled = false;
    (async () => {
      try {
        const s = await getMyCccdStatus();
        if (canceled) return;
        const locked = s.status === "pending" || s.status === "approved";
        setUploadLocked(locked);
        setLockMessage(locked ? (s.message || "CCCD dang cho duyet.") : null);
      } catch {
        if (!canceled) {
          setUploadLocked(false);
          setLockMessage(null);
        }
      } finally {
        if (!canceled) setStatusLoading(false);
      }
    })();
    return () => {
      canceled = true;
    };
  }, []);

  function onPickFile(side: "front" | "back", nextFile: File | null) {
    setError(null);
    setSuccess(null);
    setFrontFileUrl(null);
    setBackFileUrl(null);
    if (side === "front") {
      setFrontFile(nextFile);
      if (frontPreviewUrl) {
        URL.revokeObjectURL(frontPreviewUrl);
      }
      setFrontPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
      return;
    }
    setBackFile(nextFile);
    if (backPreviewUrl) {
      URL.revokeObjectURL(backPreviewUrl);
    }
    setBackPreviewUrl(nextFile ? URL.createObjectURL(nextFile) : null);
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!frontFile || !backFile) {
      setError("Vui long tai day du mat truoc va mat sau CCCD.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const result = await uploadMyCccd(frontFile, backFile);
      setSuccess(result.message || "Da tai len day du CCCD thanh cong.");
      setFrontFileUrl(result.frontFileUrl);
      setBackFileUrl(result.backFileUrl);
      setUploadLocked(true);
      setLockMessage("CCCD dang cho duyet. Ban se duoc chuyen ve trang chu.");
      setTimeout(() => {
        router.push("/");
        router.refresh();
      }, 900);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Tai CCCD that bai.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="mx-auto w-full max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 sm:p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold text-zinc-900">Upload CCCD</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Tai anh CCCD de bo phan quan tri xac minh chu so huu ten mien.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-9 items-center rounded-md border border-zinc-200 px-3 text-sm text-zinc-700 transition hover:bg-zinc-50"
          >
            Quay lai
          </Link>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          {statusLoading ? (
            <p className="rounded-md border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm text-zinc-600">
              Dang kiem tra trang thai CCCD...
            </p>
          ) : null}
          {lockMessage ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">{lockMessage}</p>
          ) : null}
          <div className="grid gap-5 md:grid-cols-2">
            <div className="h-[250px] overflow-hidden rounded-xl border-2 border-dashed border-zinc-300">
              {frontPreviewUrl ? (
                <label htmlFor="cccd-front-file" className="group relative block h-full w-full cursor-pointer">
                  <img src={frontPreviewUrl} alt="Xem truoc CCCD mat truoc" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 text-white opacity-0 transition group-hover:opacity-100">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V21h4.5L19 9.5 14.5 5 3 16.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6l4.5 4.5" />
                    </svg>
                    <span className="text-sm font-medium">Thay hinh anh</span>
                  </span>
                </label>
              ) : (
                <div className="h-full p-4 sm:p-5">
                  <label htmlFor="cccd-front-file" className="mb-2 block text-sm font-medium text-zinc-700">
                    Mat truoc CCCD (JPG/PNG/WEBP, toi da {MAX_UPLOAD_MB}MB)
                  </label>
                  <input
                    id="cccd-front-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => onPickFile("front", e.target.files?.[0] ?? null)}
                    disabled={loading || uploadLocked || statusLoading}
                    className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
                  />
                  <div className="mt-3 flex h-[145px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-400">
                    Chua chon mat truoc
                  </div>
                </div>
              )}
            </div>
            <div className="h-[250px] overflow-hidden rounded-xl border-2 border-dashed border-zinc-300">
              {backPreviewUrl ? (
                <label htmlFor="cccd-back-file" className="group relative block h-full w-full cursor-pointer">
                  <img src={backPreviewUrl} alt="Xem truoc CCCD mat sau" className="h-full w-full object-cover" />
                  <span className="absolute inset-0 flex items-center justify-center gap-2 bg-black/45 text-white opacity-0 transition group-hover:opacity-100">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5V21h4.5L19 9.5 14.5 5 3 16.5z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6l4.5 4.5" />
                    </svg>
                    <span className="text-sm font-medium">Thay hinh anh</span>
                  </span>
                </label>
              ) : (
                <div className="h-full p-4 sm:p-5">
                  <label htmlFor="cccd-back-file" className="mb-2 block text-sm font-medium text-zinc-700">
                    Mat sau CCCD (JPG/PNG/WEBP, toi da {MAX_UPLOAD_MB}MB)
                  </label>
                  <input
                    id="cccd-back-file"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={(e) => onPickFile("back", e.target.files?.[0] ?? null)}
                    disabled={loading || uploadLocked || statusLoading}
                    className="block w-full text-sm text-zinc-700 file:mr-3 file:rounded-md file:border-0 file:bg-zinc-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200"
                  />
                  <div className="mt-3 flex h-[145px] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-sm text-zinc-400">
                    Chua chon mat sau
                  </div>
                </div>
              )}
            </div>
          </div>

          {error && <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
          {success && (
            <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
              {frontFileUrl || backFileUrl ? (
                <>
                  {" "}
                  {frontFileUrl ? <a href={frontFileUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">Mat truoc</a> : null}
                  {frontFileUrl && backFileUrl ? " | " : ""}
                  {backFileUrl ? <a href={backFileUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2">Mat sau</a> : null}
                </>
              ) : null}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || uploadLocked || statusLoading || !frontFile || !backFile}
            className="inline-flex h-10 items-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Dang tai len..." : uploadLocked ? "Dang cho duyet" : "Tai du 2 mat CCCD"}
          </button>
        </form>
      </div>
    </main>
  );
}

