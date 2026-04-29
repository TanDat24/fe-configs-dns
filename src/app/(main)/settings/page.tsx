"use client";

import { useEffect, useState } from "react";
import { ApiError } from "@/lib/api/client";
import { getViewer } from "@/lib/api/auth";

export default function SettingsPage() {
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { viewer } = await getViewer();
        const roles = (viewer?.roles?.nodes ?? []).map((r) => String(r.name || "").toLowerCase());
        if (!cancelled) setAllowed(roles.includes("administrator") || roles.includes("admin"));
      } catch (err) {
        if (!cancelled && err instanceof ApiError && err.status === 401) {
          window.location.replace("/logout");
          return;
        }
        if (!cancelled) setAllowed(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return <main className="w-full py-4 text-sm text-zinc-600">Dang tai...</main>;
  }

  if (!allowed) {
    return (
      <main className="w-full py-4 ">
        <h1 className="text-xl font-semibold text-zinc-900">Settings</h1>
        <p className="mt-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Ban khong co quyen truy cap trang Settings (chi admin).
        </p>
      </main>
    );
  }

  return (
    <main className="w-full py-4 py-8">
      <h1 className="text-xl font-semibold text-zinc-900">Settings (Admin)</h1>
      <p className="mt-1 text-sm text-zinc-600">
        Cau hinh role/permission, security defaults, domain policies, system settings.
      </p>
    </main>
  );
}
