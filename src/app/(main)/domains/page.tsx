import { Suspense } from "react";
import { HomeView } from "@/components/features/home";

export default function DomainsPage() {
  return (
    <Suspense fallback={<div className="flex min-h-0 flex-1 items-center justify-center px-4 py-16 text-sm text-zinc-600">Loading...</div>}>
      <HomeView initialTab="dns" />
    </Suspense>
  );
}
