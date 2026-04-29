import { DomainOverviewView, type DomainTabId } from "@/components/features/domain-overview";

export function HomeView({ initialTab }: { initialTab?: DomainTabId } = {}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <DomainOverviewView initialTab={initialTab} />
    </div>
  );
}
