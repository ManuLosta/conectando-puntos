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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  User,
  MapPin,
  Phone,
  Mail,
  Calendar,
  ShoppingCart,
  CreditCard,
  TrendingUp,
  TrendingDown,
  FileText,
} from "lucide-react";

interface ClientDetail {
  id: string;
  name: string;
  address: string;
  type: string;
  lastPurchase: string;
  totalAmount: number;
  trend: "up" | "down";
  phone: string;
  email: string;
  registrationDate: string;
  totalOrders: number;
  averageTicket: number;
  paymentTerms: string;
  creditLimit: number;
  status: "active" | "inactive" | "at_risk";
  notes?: string;
  recentOrders: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
  }>;
}

interface ClientDetailModalProps {
  client: ClientDetail | null;
  isOpen: boolean;
  onClose: () => void;
}

function getStatusBadge(status: string) {
  switch (status) {
    case "active":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 hover:bg-green-100"
        >
          Activo
        </Badge>
      );
    case "inactive":
      return (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-800 hover:bg-gray-100"
        >
          Inactivo
        </Badge>
      );
    case "at_risk":
      return <Badge variant="destructive">En Riesgo</Badge>;
    default:
      return <Badge variant="secondary">Desconocido</Badge>;
  }
}

function getOrderStatusBadge(status: string) {
  switch (status) {
    case "DELIVERED":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 hover:bg-green-100"
        >
          Entregado
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
    case "PENDING":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
        >
          Pendiente
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
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
    month: "2-digit",
    day: "2-digit",
  });
}

export function ClientDetailModal({
  client,
  isOpen,
  onClose,
}: ClientDetailModalProps) {
  if (!client) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalles del Cliente
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Client Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Información Básica
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{client.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.address}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{client.email}</span>
                  </div>
                  {client.registrationDate && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">
                        Registrado: {formatDate(client.registrationDate)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Información Comercial
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Tipo:</span>
                    <Badge
                      variant="secondary"
                      className="bg-blue-100 text-blue-800"
                    >
                      {client.type}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Estado:</span>
                    {getStatusBadge(client.status)}
                  </div>
                  {client.paymentTerms && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Términos de Pago:</span>
                      <span className="text-sm font-medium">
                        {client.paymentTerms}
                      </span>
                    </div>
                  )}
                  {client.creditLimit > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Límite de Crédito:</span>
                      <span className="text-sm font-medium">
                        {formatCurrency(client.creditLimit)}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Estadísticas</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Total Pedidos
                  </span>
                </div>
                <span className="text-2xl font-bold">{client.totalOrders}</span>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <CreditCard className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Ticket Promedio
                  </span>
                </div>
                <span className="text-2xl font-bold">
                  {formatCurrency(client.averageTicket)}
                </span>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Total Mensual
                  </span>
                </div>
                <span className="text-2xl font-bold">
                  {formatCurrency(client.totalAmount)}
                </span>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  {client.trend === "up" ? (
                    <TrendingUp className="h-4 w-4 text-green-600" />
                  ) : (
                    <TrendingDown className="h-4 w-4 text-red-600" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    Tendencia
                  </span>
                </div>
                <span
                  className={`text-2xl font-bold ${
                    client.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {client.trend === "up" ? "↗" : "↘"}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Recent Orders */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Pedidos Recientes</h3>
            {client.recentOrders.length > 0 ? (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Pedido</TableHead>
                      <TableHead>Fecha</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Monto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {client.recentOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium">
                          {order.id}
                        </TableCell>
                        <TableCell>{formatDate(order.date)}</TableCell>
                        <TableCell>
                          {getOrderStatusBadge(order.status)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(order.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="border rounded-lg p-8 text-center">
                <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">
                  Este cliente aún no tiene pedidos registrados
                </p>
              </div>
            )}
          </div>

          {/* Notes */}
          {client.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notas
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">{client.notes}</p>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button>Editar Cliente</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
