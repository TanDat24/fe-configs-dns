import { SiteFooter } from "./site-footer";
import { SiteHeader } from "./site-header";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col">
        <div className="mx-auto flex w-full max-w-7xl flex-1 flex-col bg-white pb-8 pt-2">
          <SiteHeader />
          <div className="flex min-h-0 flex-1 flex-col bg-white">{children}</div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
