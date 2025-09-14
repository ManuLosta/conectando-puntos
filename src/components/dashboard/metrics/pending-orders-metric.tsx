import { MetricsCard } from "./metrics-card";
import { Clock } from "lucide-react";
import { dashboardService } from "@/services/dashboard";

export async function PendingOrdersMetric() {
  const data = await dashboardService.getPendingOrders();

  return (
    <MetricsCard
      title="Pedidos Pendientes"
      value={data.count.toString()}
      change={`${data.change} desde ayer`}
      changeType={data.changeType}
      icon={Clock}
    />
  );
}
