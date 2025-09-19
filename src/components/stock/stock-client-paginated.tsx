"use client";

import { useState, useEffect, useCallback } from "react";
import { StockTable } from "./stock-table";
import { NewProductModal } from "./new-product-modal";
import { AddStockModal } from "./add-stock-modal";
import { StockPagination } from "./stock-pagination";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTabsStore } from "./tabs-store";
import { usePagination } from "@/hooks/use-pagination";

// Hook useDebounce inline
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

interface StockItemFromAPI {
  id: string;
  productId: string;
  distributorId: string;
  stock: number;
  lotNumber: string;
  expirationDate: string;
  createdAt: string;
  updatedAt: string;
  product: {
    id: string;
    name: string;
    description?: string | null;
    sku: string;
    price: number;
    discountedPrice?: number;
    discount?: number;
    isActive: boolean;
  };
}

interface StockClientPaginatedProps {
  distributorId: string;
  totalProductsCount?: number;
}

interface StockResponse {
  items: StockItemFromAPI[];
  total: number;
  totalPages: number;
  currentPage: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export function StockClientPaginated({
  distributorId,
}: StockClientPaginatedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [stockData, setStockData] = useState<StockResponse | null>(null);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const { activeTab } = useTabsStore();

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Paginación
  const pagination = usePagination({
    initialPage: 1,
    itemsPerPage: 50,
    onPageChange: () => {
      // La carga se maneja en el useEffect
    },
  });

  // Función para cargar datos del servidor
  const fetchStockData = useCallback(
    async (page: number, limit: number, search?: string) => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          distributorId,
          page: page.toString(),
          limit: limit.toString(),
        });

        if (search && search.trim()) {
          params.append("search", search.trim());
        }

        const response = await fetch(`/api/stock?${params}`);
        if (!response.ok) {
          throw new Error("Error al cargar el stock");
        }

        const data = await response.json();
        setStockData(data.stock);
        pagination.setTotalItems(data.stock.total);
      } catch (error) {
        console.error("Error fetching stock:", error);
        setStockData(null);
      } finally {
        setIsLoading(false);
      }
    },
    [distributorId],
  );

  // Cargar datos cuando cambian los parámetros
  useEffect(() => {
    fetchStockData(
      pagination.currentPage,
      pagination.itemsPerPage,
      debouncedSearchQuery,
    );
  }, [
    pagination.currentPage,
    pagination.itemsPerPage,
    debouncedSearchQuery,
    fetchStockData,
  ]);

  // Reset a la primera página cuando cambia la búsqueda
  useEffect(() => {
    if (debouncedSearchQuery !== searchQuery) {
      pagination.goToFirstPage();
    }
  }, [debouncedSearchQuery, searchQuery, pagination]);

  // Reset selección cuando cambian los datos
  useEffect(() => {
    setSelectedItems([]);
  }, [stockData]);

  const handleItemSelection = (itemId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected && stockData) {
      setSelectedItems(stockData.items.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  const handleBulkStockAdjustment = () => {
    console.log("Bulk stock adjustment for items:", selectedItems);
    alert("Funcionalidad de ajuste masivo en desarrollo");
  };

  const handleGenerateReport = () => {
    console.log("Generate report for items:", selectedItems);
    alert("Funcionalidad de reporte en desarrollo");
  };

  const handleProductCreated = () => {
    console.log("Producto creado exitosamente");
    // Recargar los datos
    fetchStockData(
      pagination.currentPage,
      pagination.itemsPerPage,
      debouncedSearchQuery,
    );
  };

  const handleOpenAddStockModal = () => {
    // Si no hay productos, mostrar alerta
    if (!stockData || stockData.items.length === 0) {
      alert("No hay productos disponibles para agregar stock");
      return;
    }

    // Abrir el modal con todos los productos disponibles
    setIsAddStockModalOpen(true);
  };

  const handleStockUpdated = () => {
    console.log("Stock actualizado exitosamente");
    // Recargar los datos
    fetchStockData(
      pagination.currentPage,
      pagination.itemsPerPage,
      debouncedSearchQuery,
    );
  };

  const handlePageChange = (page: number) => {
    pagination.goToPage(page);
  };

  const handleItemsPerPageChange = (itemsPerPage: number) => {
    pagination.setItemsPerPage(itemsPerPage);
  };

  const showBulkActions = activeTab !== "all";

  return (
    <div className="space-y-4">
      {/* Header con búsqueda */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {isLoading && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
            <Input
              placeholder="Buscar por producto, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
          </div>
          <div className="flex items-center gap-2">
            {isLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Cargando...
              </div>
            ) : stockData ? (
              <p className="text-sm text-muted-foreground">
                {stockData.total}{" "}
                {stockData.total === 1 ? "producto" : "productos"}
                {searchQuery.trim() && (
                  <span className="ml-1">para &quot;{searchQuery}&quot;</span>
                )}
              </p>
            ) : null}
          </div>
        </div>

        <div className="flex gap-2">
          {showBulkActions && selectedItems.length > 0 && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={handleBulkStockAdjustment}
              >
                Ajustar Stock ({selectedItems.length})
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateReport}
              >
                Generar Reporte
              </Button>
            </>
          )}
          <Button
            onClick={handleOpenAddStockModal}
            variant="outline"
            className="border-green-200 text-green-700 hover:bg-green-50"
          >
            <Package className="h-4 w-4 mr-2" />
            Agregar Stock
          </Button>
          <Button
            onClick={() => setIsNewProductModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Tabla de stock */}
      <div className="relative">
        {isLoading && !stockData ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">
              Cargando productos...
            </span>
          </div>
        ) : stockData && stockData.items.length > 0 ? (
          <StockTable
            stockItems={stockData.items.map((item) => ({
              id: item.id,
              productId: item.productId,
              name: item.product.name,
              sku: item.product.sku,
              description: item.product.description,
              price: item.product.price,
              discountedPrice: item.product.discountedPrice,
              stock: item.stock,
              lotNumber: item.lotNumber,
              expirationDate: item.expirationDate,
              isActive: item.product.isActive,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            }))}
            distributorId={distributorId}
            showBulkActions={showBulkActions}
            selectedItems={selectedItems}
            onItemSelectionChange={handleItemSelection}
            onSelectAllChange={handleSelectAll}
            onStockUpdated={handleStockUpdated}
          />
        ) : (
          <div className="text-center py-12">
            <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-lg font-medium text-muted-foreground mb-2">
              {searchQuery.trim()
                ? "No se encontraron productos"
                : "No hay productos"}
            </p>
            <p className="text-sm text-muted-foreground">
              {searchQuery.trim()
                ? "Intenta con otros términos de búsqueda como nombre, SKU o descripción"
                : "Comienza agregando tu primer producto al inventario"}
            </p>
          </div>
        )}
      </div>

      {/* Paginación */}
      {stockData && stockData.totalPages > 1 && (
        <StockPagination
          pagination={{
            currentPage: stockData.currentPage,
            totalPages: stockData.totalPages,
            totalItems: stockData.total,
            itemsPerPage: pagination.itemsPerPage,
            hasNextPage: stockData.hasNextPage,
            hasPreviousPage: stockData.hasPreviousPage,
          }}
          onPageChange={handlePageChange}
          onItemsPerPageChange={handleItemsPerPageChange}
        />
      )}

      {/* Modal de nuevo producto */}
      <NewProductModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onProductCreated={handleProductCreated}
        distributorId={distributorId}
      />

      {/* Modal de agregar stock */}
      <AddStockModal
        stockItems={
          stockData?.items.map((item) => ({
            id: item.id,
            productId: item.productId,
            name: item.product.name,
            sku: item.product.sku,
            description: item.product.description,
            price: item.product.price,
            discountedPrice: item.product.discountedPrice,
            stock: item.stock,
            lotNumber: item.lotNumber,
            expirationDate: item.expirationDate,
            isActive: item.product.isActive,
            createdAt: item.createdAt,
            updatedAt: item.updatedAt,
          })) || []
        }
        isOpen={isAddStockModalOpen}
        onClose={() => setIsAddStockModalOpen(false)}
        onStockUpdated={handleStockUpdated}
      />
    </div>
  );
}
