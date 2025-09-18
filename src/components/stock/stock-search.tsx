"use client";

import { useEffect } from "react";
import { Search, X, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useStockSearch } from "@/hooks/use-stock-search";
import { StockClient } from "./stock-client";
import { DetailedStockItem } from "@/repositories/stock.repository";

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

// Función para transformar los datos de la API al formato esperado por los componentes
function transformSearchResults(
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

interface StockSearchProps {
  onSearchStateChange?: (isSearching: boolean, hasResults: boolean) => void;
}

export function StockSearch({ onSearchStateChange }: StockSearchProps) {
  const {
    searchResults,
    isSearching,
    searchQuery,
    setSearchQuery,
    clearSearch,
  } = useStockSearch();

  const transformedResults = transformSearchResults(searchResults);
  const hasResults = transformedResults.length > 0;
  const showResults = searchQuery.trim() && (hasResults || !isSearching);

  // Usar useEffect para notificar cambios de estado en lugar de hacerlo durante el renderizado
  useEffect(() => {
    if (onSearchStateChange) {
      onSearchStateChange(!!searchQuery.trim(), hasResults);
    }
  }, [searchQuery, hasResults, onSearchStateChange]);

  const handleClearSearch = () => {
    clearSearch();
  };

  return (
    <div className="space-y-4">
      {/* Campo de búsqueda */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por producto, SKU, lote..."
              className="pl-10 pr-10"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
            />
            {(isSearching || searchQuery) && (
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={handleClearSearch}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Resultados de búsqueda */}
      {showResults && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>
                Resultados de búsqueda para &ldquo;{searchQuery}&rdquo;
              </span>
              <Button variant="outline" size="sm" onClick={handleClearSearch}>
                <X className="h-4 w-4 mr-2" />
                Limpiar
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {hasResults ? (
              <StockClient
                stockItems={transformedResults}
                showBulkActions={false}
              />
            ) : (
              <div className="text-center py-8">
                <Search className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  No se encontraron productos que coincidan con &ldquo;
                  {searchQuery}&rdquo;
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Intenta buscar por nombre del producto, SKU o número de lote
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
