"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  DollarSign,
  Calendar,
  Hash,
  AlertTriangle,
  X,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface StockItem {
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

interface StockDetailModalProps {
  item: StockItem | null;
  isOpen: boolean;
  onClose: () => void;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function StockDetailModal({
  item,
  isOpen,
  onClose,
}: StockDetailModalProps) {
  if (!isOpen) return null;

  // Si no hay item, mostrar skeleton de carga
  if (!item) {
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold">
              Detalle de Stock: {item.productName}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Primera fila: Información del Producto */}
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
                  <p className="font-medium">{item.productName}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-mono text-sm">{item.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Precio</p>
                  <p className="text-xl font-bold text-green-600 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {formatCurrency(item.price)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <div className="mt-1">
                    {item.isActive ? (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        Activo
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Inactivo</Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Hash className="h-5 w-5" />
                  Información de Inventario
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Stock Total</p>
                  <p
                    className={`text-2xl font-bold flex items-center gap-2 ${
                      item.totalStock === 0
                        ? "text-red-600"
                        : item.isLowStock
                          ? "text-orange-600"
                          : "text-green-600"
                    }`}
                  >
                    <Package className="h-5 w-5" />
                    {item.totalStock} unidades
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Número de Lote
                  </p>
                  <p className="font-mono text-sm">{item.lotNumber}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Fecha de Vencimiento
                  </p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(item.expirationDate)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Estado del Stock
                  </p>
                  <div className="mt-1 flex flex-wrap gap-2">
                    {item.totalStock === 0 && (
                      <Badge variant="destructive">Sin stock</Badge>
                    )}
                    {item.isLowStock && item.totalStock > 0 && (
                      <Badge
                        variant="secondary"
                        className="bg-orange-100 text-orange-800"
                      >
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Stock bajo
                      </Badge>
                    )}
                    {item.isExpiring && (
                      <Badge
                        variant="secondary"
                        className="bg-red-100 text-red-800"
                      >
                        Próximo a vencer
                      </Badge>
                    )}
                    {item.totalStock > 0 && !item.isLowStock && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        En stock
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Alertas si hay problemas */}
          {(item.isLowStock || item.isExpiring || item.totalStock === 0) && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2 text-orange-800">
                  <AlertTriangle className="h-5 w-5" />
                  Alertas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {item.totalStock === 0 && (
                  <div className="flex items-center gap-2 text-red-700">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-sm">
                      Este producto no tiene stock disponible
                    </p>
                  </div>
                )}
                {item.isLowStock && item.totalStock > 0 && (
                  <div className="flex items-center gap-2 text-orange-700">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <p className="text-sm">
                      Stock bajo - considere hacer un pedido de reposición
                    </p>
                  </div>
                )}
                {item.isExpiring && (
                  <div className="flex items-center gap-2 text-red-700">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <p className="text-sm">
                      Este producto vence en los próximos 30 días
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button disabled={!item.isActive}>Ajustar Stock</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
