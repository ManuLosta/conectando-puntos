"use client";

import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, TrendingUp, WarehouseIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TabsProvider, useTabsStore } from "./tabs-store";
import { StockClientOptimized } from "./stock-client-optimized";
import { cn } from "@/lib/utils";

interface ProcessedStockItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  discountedPrice?: number;
  stock: number;
  lotNumber: string;
  expirationDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StockPageClientProps {
  allStock: ProcessedStockItem[];
  lowStock: ProcessedStockItem[];
  expiringStock: ProcessedStockItem[];
  distributorId: string;
}

function CustomTabsList({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full">
      <div className="grid w-full grid-cols-3 gap-1">{children}</div>
    </div>
  );
}

interface CustomTabsTriggerProps {
  value: "all" | "low" | "expiring";
  children: React.ReactNode;
  className?: string;
}

function CustomTabsTrigger({
  value,
  children,
  className,
}: CustomTabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsStore();
  const isActive = activeTab === value;

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "hover:bg-background/50",
        className,
      )}
    >
      {children}
    </button>
  );
}

function StockPageContent({
  allStock,
  lowStock,
  expiringStock,
  distributorId,
}: StockPageClientProps) {
  return (
    <div className="w-full space-y-4">
      <CustomTabsList>
        <CustomTabsTrigger value="all" className="flex items-center gap-2">
          <WarehouseIcon className="h-4 w-4" />
          Todo el stock
          <Badge variant="secondary" className="ml-1">
            {allStock.length}
          </Badge>
        </CustomTabsTrigger>
        <CustomTabsTrigger value="low" className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          Stock bajo
          <Badge variant="secondary" className="ml-1">
            {lowStock.length}
          </Badge>
        </CustomTabsTrigger>
        <CustomTabsTrigger value="expiring" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Próx. a vencer
          <Badge variant="secondary" className="ml-1">
            {expiringStock.length}
          </Badge>
        </CustomTabsTrigger>
      </CustomTabsList>

      <Card>
        <CardContent className="pt-6">
          <StockClientOptimized
            allStock={allStock}
            distributorId={distributorId}
          />
        </CardContent>
      </Card>
    </div>
  );
}

export function StockPageClient({
  allStock,
  lowStock,
  expiringStock,
  distributorId,
}: StockPageClientProps) {
  return (
    <TabsProvider>
      <StockPageContent
        allStock={allStock}
        lowStock={lowStock}
        expiringStock={expiringStock}
        distributorId={distributorId}
      />
    </TabsProvider>
  );
}
