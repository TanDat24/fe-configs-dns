"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { getViewer } from "@/lib/api/auth";
import { ApiError, tunnelBypassHeaders } from "@/lib/api/client";

function UsFlagIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 60 36"
      className={className}
      aria-hidden
    >
      <rect width="60" height="36" fill="#B22234" />
      <path
        fill="#fff"
        d="M0 3h60v3H0zm0 6h60v3H0zm0 6h60v3H0zm0 6h60v3H0zm0 6h60v3H0z"
      />
      <rect width="24" height="19" fill="#3C3B6E" />
    </svg>
  );
}

function displayName(
  viewer: {
    name: string | null;
    username: string | null;
    email: string | null;
  } | null,
): string {
  if (!viewer) return "Bạn";
  const n = viewer.name?.trim();
  if (n) return n;
  const u = viewer.username?.trim();
  if (u) return u;
  const e = viewer.email?.trim();
  if (e) return e;
  return "Bạn";
}

export function SiteHeader() {
  const router = useRouter();
  const [label, setLabel] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { viewer } = await getViewer();
        if (!cancelled) {
          setLabel(displayName(viewer));
        }
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          const nextPath = `${window.location.pathname}${window.location.search}`;
          window.location.replace(`/logout?next=${encodeURIComponent(nextPath)}`);
          return;
        }
        if (!cancelled) setLabel("Bạn");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: tunnelBypassHeaders(),
      });
    } catch {
      /* vẫn xóa phía client */
    }
    router.push("/logout");
    router.refresh();
  }, [router]);

  return (
    <header className="flex items-center justify-between border-b border-gray-100 bg-white px-4 py-4 sm:px-6 lg:px-8">
      <Link href="/" className="flex shrink-0 items-center outline-offset-4">
        <Image
          src="/logo-1.png"
          alt="CONFIGGS DNS Logo"
          width={320}
          height={100}
          className="h-16 w-auto object-contain object-left sm:h-[5.5rem]"
          priority
        />
      </Link>

      <div className="flex items-center">
        <div className="mr-4 flex flex-col items-end text-sm text-gray-900">
          <p className="leading-tight">
            <span className="font-normal">Xin chào, </span>
            <span className="font-bold">
              {label === null ? "…" : label}
            </span>
          </p>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="mt-1 text-xs text-gray-900 underline-offset-2 hover:underline disabled:opacity-60"
          >
            {loggingOut ? "Đang đăng xuất…" : "Đăng xuất"}
          </button>
        </div>

        <div
          className="mx-4 h-6 w-px shrink-0 bg-gray-300"
          aria-hidden
        />

        <button
          type="button"
          className="flex h-6 w-8 shrink-0 items-center justify-center rounded border border-gray-200 bg-white p-0.5 transition hover:bg-gray-50"
          aria-label="Ngôn ngữ: English"
        >
          <UsFlagIcon className="h-5 w-7 shrink-0 rounded-sm" />
        </button>
      </div>
    </header>
  );
}
