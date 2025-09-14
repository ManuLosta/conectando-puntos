import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ShoppingCart, Package, Users, FileText } from "lucide-react";
import Link from "next/link";
import type { QuickAction } from "@/services/dashboard";

interface QuickActionsProps {
  actions: QuickAction[];
  isLoading?: boolean;
}

export function QuickActions({ actions, isLoading }: QuickActionsProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Acciones Rápidas</CardTitle>
          <p className="text-sm text-muted-foreground">
            Operaciones frecuentes
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Acciones Rápidas</CardTitle>
        <p className="text-sm text-muted-foreground">Operaciones frecuentes</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action) => {
            const getIcon = () => {
              switch (action.id) {
                case "new-sale":
                  return <ShoppingCart className="h-5 w-5" />;
                case "new-purchase":
                  return <Package className="h-5 w-5" />;
                case "new-client":
                  return <Users className="h-5 w-5" />;
                case "register-payment":
                  return <FileText className="h-5 w-5" />;
                default:
                  return null;
              }
            };

            return (
              <Link key={action.id} href={action.href}>
                <Button
                  variant={action.variant === "default" ? "default" : "outline"}
                  className="h-16 w-full flex flex-col items-center justify-center gap-2"
                >
                  {getIcon()}
                  <span className="text-xs font-medium">{action.title}</span>
                </Button>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
