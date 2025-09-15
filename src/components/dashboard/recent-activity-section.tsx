import { dashboardService } from "@/services/dashboard";
import { DollarSign, Package, CheckCircle, ClipboardList } from "lucide-react";

export async function RecentActivitySection() {
  const activities = await dashboardService.getRecentActivity();

  return (
    <div className="w-full">
      <h2 className="text-xl font-bold">Actividad Reciente</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Últimas transacciones del sistema
      </p>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 rounded-lg border-2 border-dashed border-muted-foreground/25 bg-muted/20">
            <DollarSign className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              No hay actividad reciente
            </h3>
            <p className="text-sm text-muted-foreground/75 text-center max-w-sm">
              Las transacciones y actividades del sistema aparecerán aquí cuando
              estén disponibles.
            </p>
          </div>
        ) : (
          activities.map((activity) => {
            const activityIcons = {
              Venta: DollarSign,
              Compra: Package,
              Pago: CheckCircle,
              Recepcion: ClipboardList,
            };

            const activityColors = {
              Venta: "text-green-600",
              Compra: "text-blue-600",
              Pago: "text-orange-600",
              Recepcion: "text-gray-600",
            };

            const IconComponent = activityIcons[activity.type];

            return (
              <div
                key={activity.id}
                className="flex items-center space-x-4 p-4 rounded-lg border bg-card"
              >
                <IconComponent className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-sm font-medium ${activityColors[activity.type]}`}
                    >
                      {activity.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {activity.time}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {activity.description}
                  </p>
                  {activity.amount && (
                    <p className="text-xs font-medium">
                      ${activity.amount.toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
