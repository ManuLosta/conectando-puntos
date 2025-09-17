"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Check, Truck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface Order {
  id: string;
  client: string;
  salesperson: string;
  date: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "IN_PREPARATION"
    | "DELIVERED"
    | "CANCELLED";
  amount: number;
}

interface BulkConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: "confirm" | "ship";
  orders: Order[];
  isProcessing?: boolean;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function BulkConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  orders,
  isProcessing = false,
}: BulkConfirmationModalProps) {
  if (orders.length === 0) return null;

  const totalAmount = orders.reduce((sum, order) => sum + order.amount, 0);

  const getModalConfig = () => {
    switch (type) {
      case "confirm":
        return {
          title: "Confirmar Pedidos en Lote",
          icon: <Check className="h-12 w-12 text-green-600" />,
          message: `¿Estás seguro que deseas confirmar ${orders.length} pedidos?`,
          description:
            'Todos los pedidos seleccionados pasarán a estado "Confirmado" y se podrán proceder con la preparación.',
          confirmText: "Confirmar Todos",
          confirmClass: "bg-green-600 hover:bg-green-700",
          iconBg: "bg-green-100",
        };
      case "ship":
        return {
          title: "Enviar Pedidos en Lote",
          icon: <Truck className="h-12 w-12 text-blue-600" />,
          message: `¿Estás seguro que deseas marcar ${orders.length} pedidos como enviados?`,
          description:
            'Todos los pedidos seleccionados cambiarán a estado "Enviado"',
          confirmText: "Marcar como Enviados",
          confirmClass: "bg-blue-600 hover:bg-blue-700",
          iconBg: "bg-blue-100",
        };
      default:
        return {
          title: "Confirmar Acción en Lote",
          icon: <Check className="h-12 w-12 text-gray-600" />,
          message: `¿Estás seguro que deseas procesar ${orders.length} pedidos?`,
          description: "",
          confirmText: "Confirmar",
          confirmClass: "bg-gray-600 hover:bg-gray-700",
          iconBg: "bg-gray-100",
        };
    }
  };

  const config = getModalConfig();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            {config.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-6 py-4">
          {/* Icono */}
          <div className={`rounded-full p-3 ${config.iconBg}`}>
            {config.icon}
          </div>

          {/* Resumen de pedidos */}
          <div className="w-full space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <span className="font-medium">Pedidos seleccionados:</span>
                <Badge variant="secondary" className="text-lg px-3 py-1">
                  {orders.length}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-medium">Valor total:</span>
                <span className="text-2xl font-bold text-green-600">
                  {formatCurrency(totalAmount)}
                </span>
              </div>
            </div>

            {/* Lista de pedidos */}
            <div className="max-h-40 overflow-y-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pedido</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">{order.id}</TableCell>
                      <TableCell>{order.client}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(order.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Mensaje de confirmación */}
          <div className="text-center space-y-2">
            <p className="font-medium text-gray-900">{config.message}</p>
            {config.description && (
              <p className="text-sm text-gray-600">{config.description}</p>
            )}
          </div>

          {/* Botones */}
          <div className="flex gap-3 w-full pt-4">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isProcessing}
            >
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              disabled={isProcessing}
              className={`flex-1 text-white ${config.confirmClass}`}
            >
              {isProcessing ? "Procesando..." : config.confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
