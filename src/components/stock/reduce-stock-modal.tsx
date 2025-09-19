"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, TrendingDown, Package, AlertTriangle } from "lucide-react";

interface StockItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  discountedPrice?: number;
  stock: number;
  lotNumber: string;
  expirationDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ReduceStockModalProps {
  stockItem: StockItem | null;
  isOpen: boolean;
  onClose: () => void;
  onStockUpdated: () => void;
}

export function ReduceStockModal({
  stockItem,
  isOpen,
  onClose,
  onStockUpdated,
}: ReduceStockModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    quantity: "",
    reason: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = "La cantidad debe ser mayor a 0";
    }

    if (stockItem && parseInt(formData.quantity) > stockItem.stock) {
      newErrors.quantity = `No puedes reducir más de ${stockItem.stock} unidades disponibles`;
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "El motivo es obligatorio";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stockItem || !validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/stock/movement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventoryItemId: stockItem.id,
          type: "OUTBOUND",
          quantity: parseInt(formData.quantity),
          reason: formData.reason.trim(),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al disminuir stock");
      }

      // Notificar que se actualizó el stock exitosamente
      onStockUpdated();

      // Cerrar modal y limpiar formulario
      handleClose();
    } catch (error) {
      console.error("Error reducing stock:", error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Error desconocido al disminuir stock",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      quantity: "",
      reason: "",
    });
    setErrors({});
    onClose();
  };

  if (!stockItem) return null;

  const quantity = parseInt(formData.quantity) || 0;
  const newStock = Math.max(0, stockItem.stock - quantity);
  const willBeZero = newStock === 0;
  const exceedsStock = quantity > stockItem.stock;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingDown className="h-5 w-5 text-red-600" />
            Disminuir Stock
          </DialogTitle>
          <DialogDescription>
            Reduce el inventario del producto. Se registrará como salida de
            stock.
          </DialogDescription>
        </DialogHeader>

        {/* Información del producto */}
        <div className="bg-gray-50 p-4 rounded-lg space-y-2">
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-gray-600" />
            <span className="font-medium">{stockItem.name}</span>
          </div>
          <div className="text-sm text-gray-600">
            <span>SKU: {stockItem.sku}</span> •{" "}
            <span>Lote: {stockItem.lotNumber}</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Stock actual: </span>
            <span className="font-semibold">{stockItem.stock} unidades</span>
          </div>
          {formData.quantity && quantity > 0 && (
            <div className="text-sm">
              <span className="text-gray-600">Stock después: </span>
              <span
                className={`font-semibold ${exceedsStock ? "text-red-600" : willBeZero ? "text-orange-600" : "text-red-600"}`}
              >
                {exceedsStock ? "0" : newStock} unidades
              </span>
              <span
                className={`ml-2 ${exceedsStock ? "text-red-600" : "text-red-600"}`}
              >
                (-{Math.min(quantity, stockItem.stock)})
              </span>
              {willBeZero && !exceedsStock && (
                <div className="flex items-center gap-1 mt-1 text-orange-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="text-xs">El producto quedará sin stock</span>
                </div>
              )}
              {exceedsStock && (
                <div className="flex items-center gap-1 mt-1 text-red-600">
                  <AlertTriangle className="h-3 w-3" />
                  <span className="text-xs">
                    Cantidad excede el stock disponible
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error general */}
          {errors.submit && (
            <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md">
              {errors.submit}
            </div>
          )}

          {/* Cantidad a disminuir */}
          <div className="space-y-2">
            <Label htmlFor="reduce-quantity">Cantidad a disminuir *</Label>
            <Input
              id="reduce-quantity"
              type="number"
              min="1"
              max={stockItem.stock}
              value={formData.quantity}
              onChange={(e) => handleInputChange("quantity", e.target.value)}
              placeholder="Ingresa la cantidad"
              className={errors.quantity ? "border-red-500" : ""}
            />
            {errors.quantity && (
              <p className="text-sm text-red-500">{errors.quantity}</p>
            )}
            <p className="text-xs text-gray-500">
              Stock disponible: {stockItem.stock} unidades
            </p>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="reduce-reason">Motivo *</Label>
            <Textarea
              id="reduce-reason"
              value={formData.reason}
              onChange={(e) => handleInputChange("reason", e.target.value)}
              placeholder="Ej: Venta, Producto vencido, Daño, Corrección de inventario..."
              rows={3}
              className={errors.reason ? "border-red-500" : ""}
            />
            {errors.reason && (
              <p className="text-sm text-red-500">{errors.reason}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || exceedsStock}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-300"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Disminuyendo..." : "Disminuir Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
