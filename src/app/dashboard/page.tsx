import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardLoading } from "@/components/dashboard/dashboard-loading";
import {
  DailySalesMetric,
  PendingOrdersMetric,
  PurchaseOrdersMetric,
  PendingInvoicesMetric,
} from "@/components/dashboard/metrics";
import { RecentActivitySection } from "@/components/dashboard/recent-activity-section";
import { Suspense } from "react";

function DashboardContent() {
  return (
    <Suspense fallback={<DashboardLoading />}>
      <DashboardData />
    </Suspense>
  );
}

function DashboardData() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex-1 rounded-xl p-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
            <Suspense
              fallback={
                <div className="h-24 bg-muted animate-pulse rounded-lg" />
              }
            >
              <DailySalesMetric />
            </Suspense>
            <Suspense
              fallback={
                <div className="h-24 bg-muted animate-pulse rounded-lg" />
              }
            >
              <PendingOrdersMetric />
            </Suspense>
            <Suspense
              fallback={
                <div className="h-24 bg-muted animate-pulse rounded-lg" />
              }
            >
              <PurchaseOrdersMetric />
            </Suspense>
            <Suspense
              fallback={
                <div className="h-24 bg-muted animate-pulse rounded-lg" />
              }
            >
              <PendingInvoicesMetric />
            </Suspense>
          </div>

          <Suspense
            fallback={
              <div className="w-full">
                <div className="h-6 bg-muted animate-pulse rounded mb-4" />
                <div className="h-4 bg-muted animate-pulse rounded mb-6 w-1/3" />
                <div className="h-32 bg-muted animate-pulse rounded" />
              </div>
            }
          >
            <RecentActivitySection />
          </Suspense>
        </div>
      </div>
    </>
  );
}

export default function DashboardPage() {
  return <DashboardContent />;
}
