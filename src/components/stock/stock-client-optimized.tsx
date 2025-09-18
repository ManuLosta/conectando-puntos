"use client";

import { useState, useEffect, useMemo } from "react";
import { StockTable } from "./stock-table";
import { NewProductModal } from "./new-product-modal";
import { Button } from "@/components/ui/button";
import { Plus, Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useTabsStore } from "./tabs-store";

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

interface StockClientOptimizedProps {
  allStock: StockItem[];
  distributorId: string;
}

// Funciones de filtrado optimizadas
const filterStock = {
  all: (items: StockItem[]) => items,
  low: (items: StockItem[]) => items.filter((item) => item.stock <= 10),
  expiring: (items: StockItem[]) => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    return items.filter((item) => {
      const expDate = new Date(item.expirationDate);
      return expDate <= futureDate && item.stock > 0;
    });
  },
};

// Función de búsqueda optimizada
const searchInStock = (items: StockItem[], query: string): StockItem[] => {
  if (!query.trim()) return items;

  const searchTerms = query
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 0);

  if (searchTerms.length === 0) return items;

  return items.filter((item) => {
    const searchableText = [item.name, item.sku, item.description || ""]
      .join(" ")
      .toLowerCase();

    return searchTerms.every((term) => searchableText.includes(term));
  });
};

export function StockClientOptimized({
  allStock,
  distributorId,
}: StockClientOptimizedProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const { activeTab } = useTabsStore();

  // Debounce search query
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Filtrar por categoría (instantáneo)
  const categoryFilteredStock = useMemo(() => {
    return filterStock[activeTab as keyof typeof filterStock](allStock);
  }, [allStock, activeTab]);

  // Aplicar búsqueda (con debounce)
  const filteredStock = useMemo(() => {
    if (!debouncedSearchQuery.trim()) {
      return categoryFilteredStock;
    }
    return searchInStock(categoryFilteredStock, debouncedSearchQuery);
  }, [categoryFilteredStock, debouncedSearchQuery]);

  // Simular loading durante búsqueda
  useEffect(() => {
    if (searchQuery !== debouncedSearchQuery) {
      setIsSearching(true);
    } else {
      setIsSearching(false);
    }
  }, [searchQuery, debouncedSearchQuery]);

  // Reset selección cuando cambia la categoría
  useEffect(() => {
    setSelectedItems([]);
  }, [activeTab]);

  const handleStockMovement = () => {
    alert("Funcionalidad de movimiento de stock en desarrollo");
  };

  const handleItemSelection = (itemId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems((prev) => [...prev, itemId]);
    } else {
      setSelectedItems((prev) => prev.filter((id) => id !== itemId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems(filteredStock.map((item) => item.id));
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
    // Recargar la página para mostrar los datos actualizados
    window.location.reload();
  };

  const showBulkActions = activeTab !== "all";

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
                {filteredStock.length}{" "}
                {filteredStock.length === 1 ? "producto" : "productos"}
                {searchQuery.trim() && (
                  <span className="ml-1">para &quot;{searchQuery}&quot;</span>
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
            onClick={() => setIsNewProductModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
      </div>

      {/* Tabla de stock con animación suave */}
      <div className="relative">
        <StockTable
          stockItems={filteredStock}
          showBulkActions={showBulkActions}
          selectedItems={selectedItems}
          onItemSelectionChange={handleItemSelection}
          onSelectAllChange={handleSelectAll}
          onStockMovement={handleStockMovement}
        />

        {/* Mensaje cuando no hay resultados */}
        {!isSearching &&
          filteredStock.length === 0 &&
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

      {/* Modal de nuevo producto */}
      <NewProductModal
        isOpen={isNewProductModalOpen}
        onClose={() => setIsNewProductModalOpen(false)}
        onProductCreated={handleProductCreated}
        distributorId={distributorId}
      />
    </div>
  );
}
