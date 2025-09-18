"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Package,
  Calendar,
  DollarSign,
  BarChart3,
  Clock,
  X,
  AlertTriangle,
  Truck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StockItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  discountedPrice?: number;
  stock: number;
  lotNumber: string;
  expirationDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StockDetailModalProps {
  stockItem: StockItem | null;
  isOpen: boolean;
  onClose: () => void;
}

function getStockStatusBadge(stock: number) {
  if (stock === 0) {
    return (
      <Badge variant="destructive" className="flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" />
        Sin Stock
      </Badge>
    );
  } else if (stock <= 5) {
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
        Stock Crítico
      </Badge>
    );
  } else if (stock <= 10) {
    return (
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        Stock Bajo
      </Badge>
    );
  } else {
    return (
      <Badge variant="secondary" className="bg-green-100 text-green-800">
        Stock Normal
      </Badge>
    );
  }
}

function getExpirationStatus(expirationDate: string) {
  const today = new Date();
  const expDate = new Date(expirationDate);
  const daysUntilExpiry = Math.ceil(
    (expDate.getTime() - today.getTime()) / (1000 * 3600 * 24),
  );

  if (daysUntilExpiry < 0) {
    return {
      badge: (
        <Badge variant="destructive" className="flex items-center gap-1">
          <AlertTriangle className="h-3 w-3" />
          Vencido
        </Badge>
      ),
      text: `Vencido hace ${Math.abs(daysUntilExpiry)} días`,
    };
  } else if (daysUntilExpiry <= 7) {
    return {
      badge: (
        <Badge variant="secondary" className="bg-red-100 text-red-800">
          Vence Pronto
        </Badge>
      ),
      text: `Vence en ${daysUntilExpiry} días`,
    };
  } else if (daysUntilExpiry <= 30) {
    return {
      badge: (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Próximo a Vencer
        </Badge>
      ),
      text: `Vence en ${daysUntilExpiry} días`,
    };
  } else {
    return {
      badge: (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Vigente
        </Badge>
      ),
      text: `Vence en ${daysUntilExpiry} días`,
    };
  }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleDateString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return date.toLocaleString("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function StockDetailModal({
  stockItem,
  isOpen,
  onClose,
}: StockDetailModalProps) {
  if (!isOpen) return null;

  // Si no hay stockItem, mostrar skeleton de carga
  if (!stockItem) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-semibold">
                <Skeleton className="h-8 w-64" />
              </DialogTitle>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Skeletons para simular el contenido */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const expirationStatus = getExpirationStatus(stockItem.expirationDate);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold">
              Detalle de Stock - {stockItem.name}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Primera fila: Información del Producto y Estado del Stock */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Información del Producto
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Nombre</p>
                  <p className="font-medium">{stockItem.name}</p>
                </div>
                {stockItem.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Descripción</p>
                    <p className="text-sm">{stockItem.description}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-mono font-medium">{stockItem.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <Badge variant={stockItem.isActive ? "secondary" : "outline"}>
                    {stockItem.isActive ? "Activo" : "Inactivo"}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Estado del Stock
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Cantidad Actual
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-3xl font-bold">{stockItem.stock}</p>
                    {getStockStatusBadge(stockItem.stock)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Número de Lote
                  </p>
                  <p className="font-mono font-medium">{stockItem.lotNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Estado de Vencimiento
                  </p>
                  <div className="flex items-center gap-2">
                    {expirationStatus.badge}
                    <span className="text-sm">{expirationStatus.text}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Segunda fila: Precios y Fechas */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Información de Precios
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Precio Base</p>
                  <p className="text-2xl font-bold">
                    {formatCurrency(stockItem.price)}
                  </p>
                </div>
                {stockItem.discountedPrice && (
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Precio con Descuento
                    </p>
                    <p className="text-2xl font-bold text-green-600">
                      {formatCurrency(stockItem.discountedPrice)}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-muted-foreground">
                    Valor Total en Stock
                  </p>
                  <p className="text-xl font-semibold text-blue-600">
                    {formatCurrency(
                      (stockItem.discountedPrice || stockItem.price) *
                        stockItem.stock,
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Fechas Importantes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Fecha de Vencimiento
                  </p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(stockItem.expirationDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Creado</p>
                  <p className="text-sm">
                    {formatDateTime(stockItem.createdAt)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Última Actualización
                  </p>
                  <p className="text-sm">
                    {formatDateTime(stockItem.updatedAt)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tercera fila: Historial de Movimientos (placeholder) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Historial de Movimientos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <Truck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  Funcionalidad en desarrollo - Próximamente podrás ver el
                  historial completo de movimientos
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Ajustar Stock
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
