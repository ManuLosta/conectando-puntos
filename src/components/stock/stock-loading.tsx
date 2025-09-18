import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StockLoading() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Table header skeleton */}
          <div className="flex gap-4">
            <Skeleton className="h-10 w-12" />
            <Skeleton className="h-10 flex-1" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>

          {/* Table rows skeleton */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4">
              <Skeleton className="h-12 w-12" />
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-12 w-24" />
              <Skeleton className="h-12 w-32" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
