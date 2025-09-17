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
  Phone,
  Mail,
  Calendar,
  ShoppingCart,
  DollarSign,
  Users,
  FileText,
} from "lucide-react";

interface VendorDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastSale: string;
  totalSold: number;
  status: "active" | "inactive";
  clientsCount: number;
  hireDate: string;
  salesThisMonth: number;
  averageTicket: number;
  notes?: string;
  recentSales: Array<{
    id: string;
    client: string;
    date: string;
    amount: number;
  }>;
}

interface VendorDetailModalProps {
  vendor: VendorDetail | null;
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
    default:
      return <Badge variant="secondary">Desconocido</Badge>;
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

export function VendorDetailModal({
  vendor,
  isOpen,
  onClose,
}: VendorDetailModalProps) {
  if (!vendor) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalles del Vendedor
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Vendor Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Información Personal
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{vendor.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{vendor.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      Contratado: {formatDate(vendor.hireDate)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-3">
                  Información Laboral
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Estado:</span>
                    {getStatusBadge(vendor.status)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Clientes Asignados:</span>
                    <span className="text-sm font-medium">
                      {vendor.clientsCount}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Última Venta:</span>
                    <span className="text-sm font-medium">
                      {formatDate(vendor.lastSale)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Ticket Promedio:</span>
                    <span className="text-sm font-medium">
                      {formatCurrency(vendor.averageTicket)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Statistics */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Estadísticas de Ventas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Total Vendido
                  </span>
                </div>
                <span className="text-2xl font-bold">
                  {formatCurrency(vendor.totalSold)}
                </span>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Ventas Este Mes
                  </span>
                </div>
                <span className="text-2xl font-bold">
                  {formatCurrency(vendor.salesThisMonth)}
                </span>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Clientes Activos
                  </span>
                </div>
                <span className="text-2xl font-bold">
                  {vendor.clientsCount}
                </span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Recent Sales */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Ventas Recientes</h3>
            <div className="border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Fecha</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vendor.recentSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell className="font-medium">{sale.id}</TableCell>
                      <TableCell>{sale.client}</TableCell>
                      <TableCell>{formatDate(sale.date)}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(sale.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Notes */}
          {vendor.notes && (
            <>
              <Separator />
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notas
                </h3>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <p className="text-sm">{vendor.notes}</p>
                </div>
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
            <Button>Editar Vendedor</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
