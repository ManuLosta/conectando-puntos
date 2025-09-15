import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { LucideIcon } from "lucide-react";

interface MetricsCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: LucideIcon;
  iconColor?: string;
  isLoading?: boolean;
}

export function MetricsCard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  iconColor = "text-muted-foreground",
  isLoading,
}: MetricsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-1">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-5 w-5 rounded" />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Skeleton className="h-12 w-32 mb-2" />
          <Skeleton className="h-3 w-20" />
        </CardContent>
      </Card>
    );
  }

  const changeColor =
    changeType === "increase" ? "text-green-600" : "text-blue-600";
  const changePrefix = changeType === "increase" ? "+" : "";

  return (
    <Card>
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="font-medium">{title}</CardTitle>
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
      </CardHeader>
      <CardContent className="mt-0">
        <div className="text-3xl font-bold tracking-tight mb-1">{value}</div>
        <p className={`text-sm font-medium ${changeColor}`}>
          {changePrefix}
          {change} desde ayer
        </p>
      </CardContent>
    </Card>
  );
}
