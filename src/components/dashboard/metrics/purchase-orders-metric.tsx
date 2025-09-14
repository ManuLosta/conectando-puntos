import { MetricsCard } from "./metrics-card";
import { Package } from "lucide-react";
import { dashboardService } from "@/services/dashboard";

export async function PurchaseOrdersMetric() {
  const data = await dashboardService.getPurchaseOrders();

  return (
    <MetricsCard
      title="Órdenes de Compra"
      value={data.count.toString()}
      change={`${data.change} desde ayer`}
      changeType={data.changeType}
      icon={Package}
    />
  );
}
