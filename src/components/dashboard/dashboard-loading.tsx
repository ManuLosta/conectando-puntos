import { MetricsCard } from "./metrics/metrics-card";
import { DollarSign, Clock, Package, CreditCard } from "lucide-react";
import { RecentActivitySection } from "./recent-activity-section";

export function DashboardLoading() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
            <div className="h-4 w-px bg-muted mr-2" />
            <div className="flex items-center gap-2">
              <div className="h-4 w-32 bg-muted animate-pulse rounded" />
              <div className="h-4 w-px bg-muted" />
              <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            </div>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="min-h-[100vh] flex-1 rounded-xl bg-muted/50 p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <MetricsCard
              title=""
              icon={DollarSign}
              value=""
              change=""
              changeType="increase"
              isLoading={true}
            />
            <MetricsCard
              title=""
              icon={Clock}
              value=""
              change=""
              changeType="increase"
              isLoading={true}
            />
            <MetricsCard
              title=""
              icon={Package}
              value=""
              change=""
              changeType="increase"
              isLoading={true}
            />
            <MetricsCard
              title=""
              icon={CreditCard}
              value=""
              change=""
              changeType="increase"
              isLoading={true}
            />
          </div>
        </div>
      </div>
    </>
  );
}
