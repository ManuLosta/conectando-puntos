"use client";

import { useState, useEffect, useCallback } from "react";
import { StockTable } from "./stock-table";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";

// Hook useDebounce inline para evitar problemas de importación
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

interface StockItem {
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

interface StockClientProps {
  stockItems: StockItem[];
  showBulkActions?: boolean;
  stockType?: "all" | "low" | "expiring";
}

export function StockClient({
  stockItems: initialStockItems,
  showBulkActions = false,
  stockType = "all",
}: StockClientProps) {
  const [stockItems, setStockItems] = useState<StockItem[]>(initialStockItems);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [lastSearchQuery, setLastSearchQuery] = useState("");

  // Debounce search query to avoid too many requests
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  // Perform search when debounced query changes
  const performSearch = useCallback(
    async (query: string) => {
      // Don't search if query hasn't changed
      if (query === lastSearchQuery) return;

      setIsSearching(true);
      setLastSearchQuery(query);

      try {
        const searchParams = new URLSearchParams({
          q: query,
          type: stockType,
          threshold: "10",
          days: "30",
        });

        const response = await fetch(`/api/stock/search?${searchParams}`);

        if (!response.ok) {
          throw new Error("Error en la búsqueda");
        }

        const data = await response.json();
        setStockItems(data.items || []);
      } catch (error) {
        console.error("Error searching stock:", error);
        // En caso de error, mantener los items iniciales
        setStockItems(initialStockItems);
      } finally {
        setIsSearching(false);
      }
    },
    [stockType, lastSearchQuery, initialStockItems],
  );

  // Effect to trigger search when debounced query changes
  useEffect(() => {
    if (debouncedSearchQuery.trim() === "") {
      // Si no hay query, restaurar items iniciales
      setStockItems(initialStockItems);
      setIsSearching(false);
      setLastSearchQuery("");
    } else {
      // Realizar búsqueda
      performSearch(debouncedSearchQuery);
    }
  }, [debouncedSearchQuery, performSearch, initialStockItems]);

  // Reset search when stock type changes (when user changes tabs)
  useEffect(() => {
    setStockItems(initialStockItems);
    setSearchQuery("");
    setLastSearchQuery("");
  }, [stockType, initialStockItems]);

  const handleStockMovement = () => {
    // Funcionalidad de movimiento de stock (por implementar)
    alert("Funcionalidad de movimiento de stock en desarrollo");
  };

  const handleItemSelection = (itemId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems(stockItems.map((item) => item.id));
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

  const handleItemClick = () => {
    // TODO: Implementar lógica para mostrar detalles del item
    console.log("Item clicked");
  };

  return (
    <div className="space-y-4">
      {/* Header con búsqueda */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground animate-spin" />
            )}
            <Input
              placeholder="Buscar por producto, SKU..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
              disabled={isSearching}
            />
          </div>
          <div className="flex items-center gap-2">
            {isSearching ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Buscando...
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {stockItems.length}{" "}
                {stockItems.length === 1 ? "producto" : "productos"}
                {searchQuery.trim() && (
                  <span className="ml-1">
                    {searchQuery.trim() !== "" && `para "${searchQuery}"`}
                  </span>
                )}
              </p>
            )}
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
            onClick={() => {
              alert("Funcionalidad de nuevo producto en desarrollo");
            }}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Tabla de stock */}
      <div className="relative">
        {isSearching && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Buscando productos...</span>
            </div>
          </div>
        )}

        <StockTable
          stockItems={stockItems}
          showBulkActions={showBulkActions}
          selectedItems={selectedItems}
          onItemSelectionChange={handleItemSelection}
          onSelectAllChange={handleSelectAll}
          onStockMovement={handleStockMovement}
        />

        {/* Mensaje cuando no hay resultados */}
        {!isSearching &&
          stockItems.length === 0 &&
          searchQuery.trim() !== "" && (
            <div className="text-center py-12">
              <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-lg font-medium text-muted-foreground mb-2">
                No se encontraron productos
              </p>
              <p className="text-sm text-muted-foreground">
                Intenta con otros términos de búsqueda como nombre, SKU o
                descripción
              </p>
            </div>
          )}
      </div>
    </div>
  );
}
