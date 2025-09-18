"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Package,
  Calendar,
  Hash,
  DollarSign,
  Percent,
} from "lucide-react";
import { StockService, StockItemWithProduct } from "@/services/stock.service";
import { useTenant } from "@/lib/tenant-context";

export function StockList() {
  const [stockItems, setStockItems] = useState<StockItemWithProduct[]>([]);
  const [filteredItems, setFilteredItems] = useState<StockItemWithProduct[]>(
    [],
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [lowStockFilter, setLowStockFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { tenant } = useTenant();
  const stockService = new StockService();

  const LOW_STOCK_THRESHOLD = 10;

  // Función para calcular el precio con descuento
  const calculateDiscountedPrice = (
    price: number,
    discount?: number,
  ): number => {
    if (!discount) return price;
    return price - price * (discount / 100);
  };

  // Función para obtener el precio final (con descuento si existe)
  const getFinalPrice = (item: StockItemWithProduct): number => {
    if (item.product.discountedPrice) {
      return item.product.discountedPrice;
    }
    return calculateDiscountedPrice(item.product.price, item.product.discount);
  };

  useEffect(() => {
    const fetchStock = async () => {
      if (!tenant?.id) return;

      try {
        setLoading(true);
        setError(null);
        const data = await stockService.getAllStockByDistributor(tenant.id);
        setStockItems(data);
        setFilteredItems(data);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error al cargar el inventario",
        );
      } finally {
        setLoading(false);
      }
    };

    fetchStock();
  }, [tenant?.id, stockService]);

  useEffect(() => {
    let filtered = stockItems;

    // Filtro por búsqueda
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.product.name.toLowerCase().includes(query) ||
          item.product.sku.toLowerCase().includes(query) ||
          item.lotNumber.toLowerCase().includes(query),
      );
    }

    // Filtro por stock bajo
    if (lowStockFilter) {
      filtered = filtered.filter((item) => item.stock <= LOW_STOCK_THRESHOLD);
    }

    setFilteredItems(filtered);
  }, [stockItems, searchQuery, lowStockFilter]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CO", {
      style: "currency",
      currency: "COP",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("es-CO");
  };

  const isExpiringSoon = (expirationDate: Date) => {
    const today = new Date();
    const expiry = new Date(expirationDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expirationDate: Date) => {
    const today = new Date();
    const expiry = new Date(expirationDate);
    return expiry < today;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Cargando inventario...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-destructive">{error}</p>
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="mt-4"
        >
          Reintentar
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Buscar productos</Label>
          <div className="relative">
            <Search className="absolute left-2 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Buscar por nombre, SKU o lote..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="flex items-end">
          <Button
            variant={lowStockFilter ? "default" : "outline"}
            onClick={() => setLowStockFilter(!lowStockFilter)}
          >
            Stock Bajo (
            {
              stockItems.filter((item) => item.stock <= LOW_STOCK_THRESHOLD)
                .length
            }
            )
          </Button>
        </div>
      </div>

      {/* Lista de productos */}
      <div className="grid gap-4">
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <Package className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No hay productos</h3>
            <p className="text-muted-foreground">
              {searchQuery || lowStockFilter
                ? "No se encontraron productos con los filtros aplicados"
                : "No hay productos en el inventario"}
            </p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const finalPrice = getFinalPrice(item);
            const hasDiscount =
              item.product.discount && item.product.discount > 0;

            return (
              <Card key={item.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">
                        {item.product.name}
                      </CardTitle>
                      {item.product.description && (
                        <p className="text-sm text-muted-foreground mt-1">
                          {item.product.description}
                        </p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={
                          item.stock <= LOW_STOCK_THRESHOLD
                            ? "destructive"
                            : item.stock <= 50
                              ? "secondary"
                              : "default"
                        }
                      >
                        {item.stock} unidades
                      </Badge>
                      {hasDiscount && (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          <Percent className="w-3 h-3 mr-1" />
                          {item.product.discount}% OFF
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">SKU:</span>
                      <span className="font-mono">{item.product.sku}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Lote:</span>
                      <span className="font-mono">{item.lotNumber}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Vencimiento:</span>
                      <span
                        className={`font-mono ${
                          isExpired(item.expirationDate)
                            ? "text-red-600 font-semibold"
                            : isExpiringSoon(item.expirationDate)
                              ? "text-orange-600 font-semibold"
                              : ""
                        }`}
                      >
                        {formatDate(item.expirationDate)}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4 text-muted-foreground" />
                      <div className="flex flex-col">
                        <span className="font-medium">
                          {formatCurrency(finalPrice)}
                        </span>
                        {hasDiscount && (
                          <span className="text-xs text-muted-foreground line-through">
                            {formatCurrency(item.product.price)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Alertas */}
                  {(isExpired(item.expirationDate) ||
                    isExpiringSoon(item.expirationDate) ||
                    item.stock <= LOW_STOCK_THRESHOLD) && (
                    <div className="flex flex-wrap gap-2 pt-2">
                      {isExpired(item.expirationDate) && (
                        <Badge variant="destructive">Vencido</Badge>
                      )}
                      {isExpiringSoon(item.expirationDate) &&
                        !isExpired(item.expirationDate) && (
                          <Badge
                            variant="secondary"
                            className="bg-orange-100 text-orange-800"
                          >
                            Próximo a vencer
                          </Badge>
                        )}
                      {item.stock <= LOW_STOCK_THRESHOLD && (
                        <Badge
                          variant="outline"
                          className="border-red-200 text-red-700"
                        >
                          Stock bajo
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stockItems.length}</div>
            <p className="text-xs text-muted-foreground">Productos totales</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {
                stockItems.filter((item) => item.stock <= LOW_STOCK_THRESHOLD)
                  .length
              }
            </div>
            <p className="text-xs text-muted-foreground">Stock bajo</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">
              {
                stockItems.filter(
                  (item) =>
                    isExpiringSoon(item.expirationDate) ||
                    isExpired(item.expirationDate),
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">Próximos a vencer</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
