import { MetricsCard } from "./metrics-card";
import { CreditCard } from "lucide-react";
import { dashboardService } from "@/services/dashboard.service";

export async function PendingInvoicesMetric() {
  const data = await dashboardService.getPendingInvoices();

  return (
    <MetricsCard
      title="Facturas por Cobrar"
      value={`$${data.amount.toLocaleString()}`}
      change={`${data.change.toFixed(0)}%`}
      changeType={data.changeType}
      icon={CreditCard}
    />
  );
}
