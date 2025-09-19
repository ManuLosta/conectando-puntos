import { Suspense } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { StockLoading } from "@/components/stock/stock-loading";
import { stockService, StockItemWithProduct } from "@/services/stock.service";
import { StockPageClient } from "@/components/stock/stock-page-client";
import { userService } from "@/services/user.service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

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

// Función para transformar los datos del service al formato esperado por los componentes
function transformStockData(
  stockItems: StockItemWithProduct[],
): ProcessedStockItem[] {
  return stockItems.map((item) => ({
    id: item.id,
    productId: item.product.id,
    name: item.product.name,
    sku: item.product.sku,
    description: item.product.description,
    price: Number(item.product.price),
    discountedPrice: item.product.discountedPrice
      ? Number(item.product.discountedPrice)
      : undefined,
    stock: item.stock,
    lotNumber: item.lotNumber,
    expirationDate: item.expirationDate.toISOString(),
    isActive: item.product.isActive,
    createdAt: item.createdAt.toISOString(),
    updatedAt: item.updatedAt.toISOString(),
  }));
}

async function getStockData() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("No user session found");
    }

    const distributorId = await userService.getDistributorIdForUser(
      session.user.id,
    );

    if (!distributorId) {
      throw new Error("No distributor found for user");
    }

    // Solo obtenemos los contadores para las pestañas, no todos los datos
    const [lowStockResult, expiringStockResult, totalProductsCount] =
      await Promise.all([
        stockService.getLowStockByDistributor(distributorId, 10, 1, 1), // Solo necesitamos el conteo
        stockService.getExpiringStockByDistributor(distributorId, 30, 1, 1), // Solo necesitamos el conteo
        stockService.getTotalProductsCount(distributorId),
      ]);

    // Extraemos solo los items para la transformación
    const transformedLowStock = transformStockData(lowStockResult.items);
    const transformedExpiringStock = transformStockData(
      expiringStockResult.items,
    );

    return {
      allStock: [], // Ya no cargamos todos los datos aquí
      lowStock: transformedLowStock,
      expiringStock: transformedExpiringStock,
      totalProductsCount,
      distributorId,
    };
  } catch (error) {
    console.error("Error fetching stock:", error);
    return {
      allStock: [],
      lowStock: [],
      expiringStock: [],
      totalProductsCount: 0,
      distributorId: "",
    };
  }
}

export default async function StockPage() {
  const {
    allStock,
    lowStock,
    expiringStock,
    totalProductsCount,
    distributorId,
  } = await getStockData();

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

      <div className="flex flex-1 mt-2 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-col gap-4">
          <Suspense fallback={<StockLoading />}>
            <StockPageClient
              allStock={allStock}
              lowStock={lowStock}
              expiringStock={expiringStock}
              totalProductsCount={totalProductsCount}
              distributorId={distributorId}
            />
          </Suspense>
        </div>
      </div>
    </>
  );
}
