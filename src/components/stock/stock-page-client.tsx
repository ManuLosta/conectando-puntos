"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  AlertTriangle,
  TrendingUp,
  WarehouseIcon,
  History,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { TabsProvider, useTabsStore } from "./tabs-store";
import { useState, useEffect } from "react";
import { StockClientPaginated } from "./stock-client-paginated";
import { StockFilteredPaginated } from "./stock-filtered-paginated";
import { StockMovementsClient } from "./stock-movements-client";
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
  totalProductsCount: number;
  distributorId: string;
}

function CustomTabsList({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full">
      <div className="grid w-full grid-cols-4 gap-1">{children}</div>
    </div>
  );
}

interface CustomTabsTriggerProps {
  value: "all" | "low" | "expiring" | "movements";
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
      type="button"
      onClick={() => setActiveTab(value)}
      className={cn(
        "inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
        isActive
          ? "bg-background text-foreground shadow-sm"
          : "hover:bg-background/50",
        className,
      )}
      role="tab"
      aria-selected={isActive}
      tabIndex={isActive ? 0 : -1}
    >
      {children}
    </button>
  );
}

function StockPageContent({
  lowStock,
  expiringStock,
  totalProductsCount,
  distributorId,
}: StockPageClientProps) {
  const { activeTab } = useTabsStore();
  const [lowStockCount, setLowStockCount] = useState(lowStock.length);
  const [expiringStockCount, setExpiringStockCount] = useState(
    expiringStock.length,
  );

  // Actualizar conteos cuando cambien los datos iniciales
  useEffect(() => {
    setLowStockCount(lowStock.length);
    setExpiringStockCount(expiringStock.length);
  }, [lowStock.length, expiringStock.length]);

  return (
    <div className="w-full space-y-4">
      <div role="tablist" className="w-full">
        <CustomTabsList>
          <CustomTabsTrigger value="all" className="flex items-center gap-2">
            <WarehouseIcon className="h-4 w-4" />
            <span>Todo el stock</span>
            <Badge variant="secondary" className="ml-1">
              {totalProductsCount}
            </Badge>
          </CustomTabsTrigger>
          <CustomTabsTrigger value="low" className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            <span>Stock bajo</span>
            <Badge variant="secondary" className="ml-1">
              {lowStockCount}
            </Badge>
          </CustomTabsTrigger>
          <CustomTabsTrigger
            value="expiring"
            className="flex items-center gap-2"
          >
            <TrendingUp className="h-4 w-4" />
            <span>Próx. a vencer</span>
            <Badge variant="secondary" className="ml-1">
              {expiringStockCount}
            </Badge>
          </CustomTabsTrigger>
          <CustomTabsTrigger
            value="movements"
            className="flex items-center gap-2"
          >
            <History className="h-4 w-4" />
            <span>Movimientos de Stock</span>
          </CustomTabsTrigger>
        </CustomTabsList>
      </div>

      <Card>
        <CardContent className="pt-6">
          {activeTab === "movements" ? (
            <StockMovementsClient distributorId={distributorId} />
          ) : activeTab === "all" ? (
            <StockClientPaginated
              distributorId={distributorId}
              totalProductsCount={totalProductsCount}
            />
          ) : activeTab === "low" ? (
            <StockFilteredPaginated
              distributorId={distributorId}
              filterType="low"
              threshold={10}
            />
          ) : (
            <StockFilteredPaginated
              distributorId={distributorId}
              filterType="expiring"
              daysFromNow={30}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function StockPageClient({
  allStock,
  lowStock,
  expiringStock,
  totalProductsCount,
  distributorId,
}: StockPageClientProps) {
  return (
    <TabsProvider>
      <StockPageContent
        allStock={allStock}
        lowStock={lowStock}
        expiringStock={expiringStock}
        totalProductsCount={totalProductsCount}
        distributorId={distributorId}
      />
    </TabsProvider>
  );
}
