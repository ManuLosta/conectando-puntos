import { MetricsCard } from "./metrics-card";
import { DollarSign } from "lucide-react";
import { dashboardService } from "@/services/dashboard";

export async function DailySalesMetric() {
  const data = await dashboardService.getDailySales();

  return (
    <MetricsCard
      title="Ventas del Día"
      value={`$${data.amount.toLocaleString()}`}
      change={`${data.change.toFixed(0)}%`}
      changeType={data.changeType}
      icon={DollarSign}
    />
  );
}
