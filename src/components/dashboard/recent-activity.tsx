import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DollarSign, Package, CheckCircle, ClipboardList } from "lucide-react";
import type { RecentActivity } from "@/services/dashboard.service";

interface RecentActivityProps {
  activities: RecentActivity[];
  isLoading?: boolean;
}

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

export function RecentActivity({ activities, isLoading }: RecentActivityProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Actividad Reciente</CardTitle>
          <p className="text-sm text-muted-foreground">
            Últimas transacciones del sistema
          </p>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3">
                <Skeleton className="h-5 w-5 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Actividad Reciente</CardTitle>
        <p className="text-sm text-muted-foreground">
          Últimas transacciones del sistema
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => {
            const IconComponent = activityIcons[activity.type];
            return (
              <div key={activity.id} className="flex items-center space-x-3">
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
          })}
        </div>
      </CardContent>
    </Card>
  );
}
