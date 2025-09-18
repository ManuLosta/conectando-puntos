"use client";

import { useState, useEffect } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  AlertTriangle,
  TrendingUp,
  Plus,
  History,
} from "lucide-react";
import { StockLoading } from "@/components/stock/stock-loading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { StockClient } from "@/components/stock/stock-client";
import { StockSearch } from "@/components/stock/stock-search";
import { AddStockModal } from "@/components/stock/add-stock-modal";
import { Button } from "@/components/ui/button";
import { DetailedStockItem } from "@/repositories/stock.repository";
import { StockMovementsClient } from "@/components/stock/stock-movements-client";
import { StockMovementsLoading } from "@/components/stock/stock-movements-loading";

interface ProcessedStockItem {
  id: string;
  productName: string;
  sku: string;
  price: number;
  totalStock: number;
  lotNumber: string;
  expirationDate: string;
  isActive: boolean;
  isLowStock: boolean;
  isExpiring: boolean;
}

interface StockMovement {
  id: string;
  type: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "TRANSFER";
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  createdAt: Date;
  inventoryItem: {
    id: string;
    lotNumber: string;
    expirationDate: Date;
    product: {
      id: string;
      name: string;
      sku: string;
      price: number;
    };
  };
  order: {
    id: string;
    orderNumber: string;
  } | null;
}

// Función para transformar los datos del API al formato esperado por los componentes
function transformStockData(
  stockItems: DetailedStockItem[],
): ProcessedStockItem[] {
  const today = new Date();
  const thirtyDaysFromNow = new Date(
    today.getTime() + 30 * 24 * 60 * 60 * 1000,
  );

  return stockItems.map((item) => ({
    id: item.id,
    productName: item.product.name,
    sku: item.product.sku,
    price: Number(item.product.price),
    totalStock: item.stock,
    lotNumber: item.lotNumber,
    expirationDate:
      typeof item.expirationDate === "string"
        ? item.expirationDate
        : item.expirationDate.toISOString(),
    isActive: item.product.isActive,
    isLowStock: item.stock <= 10,
    isExpiring: new Date(item.expirationDate) <= thirtyDaysFromNow,
  }));
}

// Función para transformar los datos de movimientos
function transformMovementsData(movements: unknown[]): StockMovement[] {
  return movements.map((movement: unknown) => {
    const mov = movement as Record<string, unknown>;
    const inventoryItem = mov.inventoryItem as Record<string, unknown>;
    const product = inventoryItem?.product as Record<string, unknown>;

    return {
      id: mov.id as string,
      productName: (product?.name as string) || "Producto desconocido",
      sku: (product?.sku as string) || "N/A",
      type: mov.type as "ENTRADA" | "SALIDA" | "AJUSTE",
      quantity: mov.quantity as number,
      date: mov.createdAt as string,
      notes: (mov.notes as string) || "",
      lotNumber: (mov.lotNumber as string) || "",
      expirationDate: (mov.expirationDate as string) || null,
    };
  });
}

function StockSection({
  stockItems,
  title,
  icon: Icon,
  description,
  emptyMessage,
  showBulkActions = false,
}: {
  stockItems: ProcessedStockItem[];
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  emptyMessage: string;
  showBulkActions?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
            <Badge variant="secondary" className="ml-2">
              {stockItems.length}
            </Badge>
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {stockItems.length > 0 ? (
          <StockClient
            stockItems={stockItems}
            showBulkActions={showBulkActions}
          />
        ) : (
          <div className="text-center py-8">
            <Icon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function StockPage() {
  const [allStock, setAllStock] = useState<ProcessedStockItem[]>([]);
  const [lowStockItems, setLowStockItems] = useState<ProcessedStockItem[]>([]);
  const [expiringItems, setExpiringItems] = useState<ProcessedStockItem[]>([]);
  const [stockMovements, setStockMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [movementsLoading, setMovementsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        const response = await fetch("/api/stock");
        if (response.ok) {
          const stockData = await response.json();
          const transformed = transformStockData(stockData);

          setAllStock(transformed);
          setLowStockItems(transformed.filter((item) => item.isLowStock));
          setExpiringItems(transformed.filter((item) => item.isExpiring));
        } else {
          console.error("Error fetching stock data:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching stock data:", error);
      } finally {
        setLoading(false);
      }
    };

    const fetchMovementsData = async () => {
      try {
        const response = await fetch("/api/stock/movements");
        if (response.ok) {
          const movementsData = await response.json();
          const transformed = transformMovementsData(movementsData);
          setStockMovements(transformed);
        } else {
          console.error("Error fetching movements data:", response.statusText);
        }
      } catch (error) {
        console.error("Error fetching movements data:", error);
      } finally {
        setMovementsLoading(false);
      }
    };

    fetchStockData();
    fetchMovementsData();
  }, []);

  const handleSearchStateChange = (searching: boolean) => {
    setIsSearching(searching);
  };

  const handleAddStock = async (stockData: {
    productName: string;
    sku: string;
    price: number;
    description?: string;
    stock: number;
    lotNumber: string;
    expirationDate: string;
  }) => {
    try {
      const response = await fetch("/api/stock/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(stockData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al agregar stock");
      }

      const result = await response.json();
      console.log("Stock agregado exitosamente:", result.message);

      setIsAddModalOpen(false);

      // Recargar los datos del stock
      const stockResponse = await fetch("/api/stock");
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        const transformed = transformStockData(stockData);

        setAllStock(transformed);
        setLowStockItems(transformed.filter((item) => item.isLowStock));
        setExpiringItems(transformed.filter((item) => item.isExpiring));
      }

      // Recargar los movimientos
      const movementsResponse = await fetch("/api/stock/movements");
      if (movementsResponse.ok) {
        const movementsData = await movementsResponse.json();
        const transformedMovements = transformMovementsData(movementsData);
        setStockMovements(transformedMovements);
      }
    } catch (error) {
      console.error("Error al agregar stock:", error);
      alert(
        `Error al agregar el stock: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  };

  if (loading) {
    return (
      <>
        <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
          <div className="flex items-center gap-2 px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem>
                  <BreadcrumbPage>Stock</BreadcrumbPage>
                </BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <StockLoading />
        </div>
      </>
    );
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Stock</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-col gap-4">
          {/* Header with title and add button */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Gestión de Stock</h1>
              <p className="text-muted-foreground">
                Administra y controla el inventario de todos tus productos
              </p>
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-green-600 hover:bg-green-700 text-white flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Agregar Nuevo Stock
            </Button>
          </div>

          {/* Componente de búsqueda */}
          <StockSearch onSearchStateChange={handleSearchStateChange} />

          {/* Tabs solo se muestran cuando no hay búsqueda activa */}
          {!isSearching && (
            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all" className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Todo el stock
                  <Badge variant="secondary" className="ml-1">
                    {allStock.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="low-stock"
                  className="flex items-center gap-2"
                >
                  <AlertTriangle className="h-4 w-4" />
                  Stock bajo
                  <Badge variant="secondary" className="ml-1">
                    {lowStockItems.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="expiring"
                  className="flex items-center gap-2"
                >
                  <TrendingUp className="h-4 w-4" />
                  Por vencer
                  <Badge variant="secondary" className="ml-1">
                    {expiringItems.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger
                  value="movements"
                  className="flex items-center gap-2"
                >
                  <History className="h-4 w-4" />
                  Transacciones
                  <Badge variant="secondary" className="ml-1">
                    {stockMovements.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4">
                <StockSection
                  stockItems={allStock}
                  title="Todo el Stock"
                  icon={Package}
                  description="Vista completa de todo el inventario disponible"
                  emptyMessage="No hay productos en stock"
                />
              </TabsContent>

              <TabsContent value="low-stock" className="space-y-4">
                <StockSection
                  stockItems={lowStockItems}
                  title="Stock Bajo"
                  icon={AlertTriangle}
                  description="Productos con stock bajo que necesitan reposición"
                  emptyMessage="No hay productos con stock bajo"
                  showBulkActions={true}
                />
              </TabsContent>

              <TabsContent value="expiring" className="space-y-4">
                <StockSection
                  stockItems={expiringItems}
                  title="Productos por Vencer"
                  icon={TrendingUp}
                  description="Productos que vencen en los próximos 30 días"
                  emptyMessage="No hay productos próximos a vencer"
                  showBulkActions={true}
                />
              </TabsContent>

              <TabsContent value="movements" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <History className="h-5 w-5" />
                      Transacciones de Stock
                      <Badge variant="secondary" className="ml-2">
                        {stockMovements.length}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                      Historial completo de movimientos de inventario
                    </p>
                  </CardHeader>
                  <CardContent>
                    {movementsLoading ? (
                      <StockMovementsLoading />
                    ) : stockMovements.length > 0 ? (
                      <StockMovementsClient movements={stockMovements} />
                    ) : (
                      <div className="text-center py-8">
                        <History className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                        <p className="text-muted-foreground">
                          No hay transacciones de stock registradas
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </div>

      {/* Modal para agregar nuevo stock */}
      <AddStockModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onConfirm={handleAddStock}
      />
    </>
  );
}
