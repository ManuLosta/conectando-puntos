"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Minus, Package } from "lucide-react";

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

interface StockAdjustmentModalProps {
  item: StockItem | null;
  isOpen: boolean;
  type: "increase" | "decrease";
  onClose: () => void;
  onConfirm: (quantity: number, reason: string) => void;
}

export function StockAdjustmentModal({
  item,
  isOpen,
  type,
  onClose,
  onConfirm,
}: StockAdjustmentModalProps) {
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!item) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (quantity <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }

    if (type === "decrease" && quantity > item.totalStock) {
      alert("No se puede reducir más stock del disponible");
      return;
    }

    if (!reason.trim()) {
      alert("Por favor ingrese una razón para el ajuste");
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(quantity, reason.trim());
      // Reset form
      setQuantity(1);
      setReason("");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setQuantity(1);
    setReason("");
    onClose();
  };

  const getModalConfig = () => {
    switch (type) {
      case "increase":
        return {
          title: "Aumentar Stock",
          icon: <Plus className="h-8 w-8 text-green-600" />,
          description: "Agregue unidades al inventario del producto",
          actionText: "Aumentar Stock",
          actionClass: "bg-green-600 hover:bg-green-700",
          iconBg: "bg-green-100",
        };
      case "decrease":
        return {
          title: "Reducir Stock",
          icon: <Minus className="h-8 w-8 text-orange-600" />,
          description: "Retire unidades del inventario del producto",
          actionText: "Reducir Stock",
          actionClass: "bg-orange-600 hover:bg-orange-700",
          iconBg: "bg-orange-100",
        };
    }
  };

  const config = getModalConfig();
  const newStock =
    type === "increase"
      ? item.totalStock + quantity
      : Math.max(0, item.totalStock - quantity);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-center">
            {config.title}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Icono y descripción */}
          <div className="flex flex-col items-center space-y-4">
            <div className={`rounded-full p-3 ${config.iconBg}`}>
              {config.icon}
            </div>
            <p className="text-center text-sm text-muted-foreground">
              {config.description}
            </p>
          </div>

          {/* Información del producto */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{item.productName}</span>
            </div>
            <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
            <p className="text-sm text-muted-foreground">
              Lote: {item.lotNumber}
            </p>
            <p className="text-sm font-medium">
              Stock actual: <span className="text-lg">{item.totalStock}</span>{" "}
              unidades
            </p>
          </div>

          {/* Campo de cantidad */}
          <div className="space-y-2">
            <Label htmlFor="quantity">
              Cantidad a {type === "increase" ? "agregar" : "retirar"}
            </Label>
            <Input
              id="quantity"
              type="number"
              min="1"
              max={type === "decrease" ? item.totalStock : undefined}
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
              placeholder="Ingrese la cantidad"
              required
            />
            <p className="text-xs text-muted-foreground">
              Stock resultante: <span className="font-medium">{newStock}</span>{" "}
              unidades
            </p>
          </div>

          {/* Campo de razón */}
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo del ajuste</Label>
            <Textarea
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={`Explique por qué ${type === "increase" ? "aumenta" : "reduce"} el stock...`}
              rows={3}
              required
            />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className={`flex-1 text-white ${config.actionClass}`}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Procesando..." : config.actionText}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
