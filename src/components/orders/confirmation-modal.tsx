"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Check, Truck, X } from "lucide-react";

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

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  type: "confirm" | "ship" | "cancel";
  order: Order | null;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function ConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  type,
  order,
}: ConfirmationModalProps) {
  if (!order) return null;

  const getModalConfig = () => {
    switch (type) {
      case "confirm":
        return {
          title: "Confirmar Pedido",
          icon: <Check className="h-12 w-12 text-green-600" />,
          message: "¿Estás seguro que deseas confirmar este pedido?",
          description:
            'Una vez confirmado, el pedido pasará a estado "Confirmado" y se podrá proceder con la preparación.',
          confirmText: "Confirmar Pedido",
          confirmClass: "bg-green-600 hover:bg-green-700",
          iconBg: "bg-green-100",
        };
      case "ship":
        return {
          title: "Enviar Pedido",
          icon: <Truck className="h-12 w-12 text-blue-600" />,
          message: "¿Estás seguro que deseas marcar este pedido como enviado?",
          description: 'El pedido cambiará a estado "Enviado"',
          confirmText: "Marcar como Enviado",
          confirmClass: "bg-blue-600 hover:bg-blue-700",
          iconBg: "bg-blue-100",
        };
      case "cancel":
        return {
          title: "Cancelar Pedido",
          icon: <X className="h-12 w-12 text-red-600" />,
          message: "¿Estás seguro que deseas cancelar este pedido?",
          description:
            "Esta acción no se puede deshacer. El pedido será marcado como cancelado y no se podrá procesar.",
          confirmText: "Cancelar Pedido",
          confirmClass: "bg-red-600 hover:bg-red-700",
          iconBg: "bg-red-100",
        };
      default:
        return {
          title: "Confirmar Acción",
          icon: <AlertTriangle className="h-12 w-12 text-orange-600" />,
          message: "¿Estás seguro que deseas realizar esta acción?",
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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            {config.title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-4">
          {/* Icono */}
          <div className={`rounded-full p-3 ${config.iconBg}`}>
            {config.icon}
          </div>

          {/* Información del pedido */}
          <div className="text-center space-y-2">
            <div className="bg-gray-50 rounded-lg p-3 space-y-1">
              <p className="text-sm text-gray-600">Pedido:</p>
              <p className="font-semibold">{order.id}</p>
              <p className="text-sm text-gray-600">Cliente:</p>
              <p className="font-medium">{order.client}</p>
              <p className="text-sm text-gray-600">Monto:</p>
              <p className="font-semibold text-lg">
                {formatCurrency(order.amount)}
              </p>
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
            <Button variant="outline" onClick={onClose} className="flex-1">
              Cancelar
            </Button>
            <Button
              onClick={onConfirm}
              className={`flex-1 text-white ${config.confirmClass}`}
            >
              {config.confirmText}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
