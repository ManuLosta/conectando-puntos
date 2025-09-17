"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  MapPin,
  Calendar,
  Package,
  DollarSign,
  FileText,
  Truck,
  X,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";

interface OrderItem {
  id: string;
  product: {
    name: string;
    sku: string;
    brand?: string;
  };
  quantity: number;
  price: number;
  subtotal: number;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  client: string;
  salesperson: string;
  date: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "DELIVERED"
    | "CANCELLED"
    | "IN_PREPARATION"
    | "IN_TRANSIT";
  paymentStatus: "PENDING" | "PAID" | "PARTIAL" | "REJECTED";
  amount: number;
  deliveryAddress?: string;
  notes?: string;
  items: OrderItem[];
}

interface OrderDetailModalProps {
  order: OrderDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

function getStatusBadge(status: OrderDetail["status"]) {
  switch (status) {
    case "PENDING":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
        >
          Pendiente
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 hover:bg-blue-100"
        >
          Confirmado
        </Badge>
      );
    case "IN_PREPARATION":
      return (
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-800 hover:bg-purple-100"
        >
          En Preparación
        </Badge>
      );
    case "IN_TRANSIT":
      return (
        <Badge
          variant="secondary"
          className="bg-orange-100 text-orange-800 hover:bg-orange-100"
        >
          En Tránsito
        </Badge>
      );
    case "DELIVERED":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 hover:bg-green-100"
        >
          Entregado
        </Badge>
      );
    case "CANCELLED":
      return <Badge variant="destructive">Cancelado</Badge>;
    default:
      return <Badge variant="secondary">Desconocido</Badge>;
  }
}

function getPaymentStatusBadge(status: OrderDetail["paymentStatus"]) {
  switch (status) {
    case "PENDING":
      return (
        <Badge variant="outline" className="text-yellow-700 border-yellow-300">
          Pendiente
        </Badge>
      );
    case "PAID":
      return (
        <Badge variant="outline" className="text-green-700 border-green-300">
          Pagado
        </Badge>
      );
    case "PARTIAL":
      return (
        <Badge variant="outline" className="text-blue-700 border-blue-300">
          Parcial
        </Badge>
      );
    case "REJECTED":
      return <Badge variant="destructive">Rechazado</Badge>;
    default:
      return <Badge variant="outline">Desconocido</Badge>;
  }
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
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function OrderDetailModal({
  order,
  isOpen,
  onClose,
}: OrderDetailModalProps) {
  if (!isOpen) return null;

  // Si no hay order, mostrar skeleton de carga
  if (!order) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto">
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
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Información del Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Cliente</p>
                    <Skeleton className="h-5 w-48 mt-1" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Vendedor</p>
                    <Skeleton className="h-5 w-32 mt-1" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">
                      Fecha del Pedido
                    </p>
                    <Skeleton className="h-5 w-40 mt-1" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Estado del Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Estado</p>
                    <Skeleton className="h-6 w-24 mt-1" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pago</p>
                    <Skeleton className="h-6 w-20 mt-1" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total</p>
                    <Skeleton className="h-8 w-32 mt-1" />
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Cargando productos...
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold">
              Detalle del Pedido {order.orderNumber}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Primera fila: Información del Cliente y Estado */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Información del Cliente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <p className="font-medium">{order.client}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vendedor</p>
                  <p className="font-medium">{order.salesperson}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">
                    Fecha del Pedido
                  </p>
                  <p className="font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(order.date)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Estado del Pedido
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground">Estado</p>
                  <div className="mt-1">{getStatusBadge(order.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pago</p>
                  <div className="mt-1">
                    {getPaymentStatusBadge(order.paymentStatus)}
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold text-green-600 flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {formatCurrency(order.amount)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Segunda fila: Dirección de Entrega */}
          {order.deliveryAddress && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Dirección de Entrega
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="flex items-start gap-2">
                  <Truck className="h-4 w-4 mt-1 text-muted-foreground" />
                  {order.deliveryAddress}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Tercera fila: Notas */}
          {order.notes && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Notas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{order.notes}</p>
              </CardContent>
            </Card>
          )}

          {/* Cuarta fila: Detalle de Productos - LA MÁS IMPORTANTE */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Productos ({order.items.length} artículos)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-semibold min-w-[250px]">
                        Producto
                      </TableHead>
                      <TableHead className="font-semibold min-w-[120px]">
                        SKU
                      </TableHead>
                      <TableHead className="font-semibold text-center min-w-[100px]">
                        Cantidad
                      </TableHead>
                      <TableHead className="font-semibold text-right min-w-[120px]">
                        Precio Unit.
                      </TableHead>
                      <TableHead className="font-semibold text-right min-w-[120px]">
                        Subtotal
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell className="min-w-[250px]">
                          <div>
                            <p className="font-medium">{item.product.name}</p>
                            {item.product.brand && (
                              <p className="text-sm text-muted-foreground">
                                {item.product.brand}
                              </p>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-sm min-w-[120px]">
                          {item.product.sku}
                        </TableCell>
                        <TableCell className="text-center font-medium min-w-[100px]">
                          {item.quantity}
                        </TableCell>
                        <TableCell className="text-right min-w-[120px]">
                          {formatCurrency(item.price)}
                        </TableCell>
                        <TableCell className="text-right font-medium min-w-[120px]">
                          {formatCurrency(item.subtotal)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <Separator className="my-4" />

              <div className="flex justify-end">
                <div className="text-right space-y-2">
                  <div className="flex justify-between items-center gap-8">
                    <span className="text-lg font-medium">Total:</span>
                    <span className="text-2xl font-bold text-green-600">
                      {formatCurrency(order.amount)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acciones */}
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button>Imprimir Pedido</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
