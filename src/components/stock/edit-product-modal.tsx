"use client";

import React, { useState, useEffect } from "react";
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
import { Loader2, Edit3 } from "lucide-react";

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

interface EditProductModalProps {
  stockItem: StockItem | null;
  isOpen: boolean;
  onClose: () => void;
  onProductUpdated: () => void;
}

export function EditProductModal({
  stockItem,
  isOpen,
  onClose,
  onProductUpdated,
}: EditProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    price: "",
    discount: "",
    discountedPrice: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar datos del producto cuando se abre el modal
  useEffect(() => {
    if (stockItem && isOpen) {
      const discount =
        stockItem.discountedPrice && stockItem.price > 0
          ? (
              ((stockItem.price - stockItem.discountedPrice) /
                stockItem.price) *
              100
            ).toFixed(2)
          : "";

      setFormData({
        name: stockItem.name,
        description: stockItem.description || "",
        sku: stockItem.sku,
        price: stockItem.price.toString(),
        discount: discount,
        discountedPrice: stockItem.discountedPrice?.toString() || "",
      });
      setErrors({});
    }
  }, [stockItem, isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Calcular precio con descuento automáticamente
      if (field === "price" || field === "discount") {
        const price = parseFloat(field === "price" ? value : prev.price) || 0;
        const discount =
          parseFloat(field === "discount" ? value : prev.discount) || 0;

        if (price > 0 && discount > 0 && discount < 100) {
          const discountedPrice = price * (1 - discount / 100);
          newData.discountedPrice = discountedPrice.toFixed(2);
        } else if (discount === 0) {
          newData.discountedPrice = "";
        }
      }

      return newData;
    });

    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "El nombre del producto es obligatorio";
    }

    if (!formData.sku.trim()) {
      newErrors.sku = "El SKU es obligatorio";
    }

    if (!formData.price || parseFloat(formData.price) <= 0) {
      newErrors.price = "El precio debe ser mayor a 0";
    }

    if (
      formData.discount &&
      (parseFloat(formData.discount) < 0 ||
        parseFloat(formData.discount) >= 100)
    ) {
      newErrors.discount = "El descuento debe estar entre 0 y 99.99%";
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
      const response = await fetch("/api/stock/product", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: stockItem.productId,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          sku: formData.sku.trim(),
          price: parseFloat(formData.price),
          discount: formData.discount ? parseFloat(formData.discount) : null,
          discountedPrice: formData.discountedPrice
            ? parseFloat(formData.discountedPrice)
            : null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al actualizar el producto");
      }

      // Notificar que se actualizó el producto exitosamente
      onProductUpdated();

      // Cerrar modal
      handleClose();
    } catch (error) {
      console.error("Error updating product:", error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Error desconocido al actualizar el producto",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      description: "",
      sku: "",
      price: "",
      discount: "",
      discountedPrice: "",
    });
    setErrors({});
    onClose();
  };

  if (!stockItem) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Edit3 className="h-5 w-5" />
            Modificar Producto
          </DialogTitle>
          <DialogDescription>
            Modifica la información del producto. Los cambios se aplicarán
            inmediatamente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error general */}
          {errors.submit && (
            <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md">
              {errors.submit}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Nombre del producto */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre del producto *</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Nombre del producto"
                className={errors.name ? "border-red-500" : ""}
              />
              {errors.name && (
                <p className="text-sm text-red-500">{errors.name}</p>
              )}
            </div>

            {/* SKU */}
            <div className="space-y-2">
              <Label htmlFor="edit-sku">SKU *</Label>
              <Input
                id="edit-sku"
                value={formData.sku}
                onChange={(e) =>
                  handleInputChange("sku", e.target.value.toUpperCase())
                }
                placeholder="SKU único del producto"
                className={errors.sku ? "border-red-500" : ""}
              />
              {errors.sku && (
                <p className="text-sm text-red-500">{errors.sku}</p>
              )}
            </div>

            {/* Precio */}
            <div className="space-y-2">
              <Label htmlFor="edit-price">Precio *</Label>
              <Input
                id="edit-price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => handleInputChange("price", e.target.value)}
                placeholder="0.00"
                className={errors.price ? "border-red-500" : ""}
              />
              {errors.price && (
                <p className="text-sm text-red-500">{errors.price}</p>
              )}
            </div>

            {/* Descuento */}
            <div className="space-y-2">
              <Label htmlFor="edit-discount">Descuento (%)</Label>
              <Input
                id="edit-discount"
                type="number"
                step="0.01"
                min="0"
                max="99.99"
                value={formData.discount}
                onChange={(e) => handleInputChange("discount", e.target.value)}
                placeholder="0"
                className={errors.discount ? "border-red-500" : ""}
              />
              {errors.discount && (
                <p className="text-sm text-red-500">{errors.discount}</p>
              )}
            </div>

            {/* Precio con descuento (calculado automáticamente) */}
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="edit-discountedPrice">Precio con descuento</Label>
              <Input
                id="edit-discountedPrice"
                type="number"
                step="0.01"
                value={formData.discountedPrice}
                disabled
                placeholder="Se calcula automáticamente"
                className="bg-gray-50"
              />
              <p className="text-xs text-gray-500">
                Se calcula automáticamente al ingresar precio y descuento
              </p>
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="edit-description">Descripción</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Descripción del producto (opcional)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Guardando..." : "Guardar Cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
