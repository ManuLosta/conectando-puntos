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
import { Loader2 } from "lucide-react";

interface NewProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProductCreated: () => void;
  distributorId: string;
}

export function NewProductModal({
  isOpen,
  onClose,
  onProductCreated,
  distributorId,
}: NewProductModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    sku: "",
    price: "",
    discount: "",
    discountedPrice: "",
    stock: "",
    lotNumber: "",
    expirationDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => {
      const newData = { ...prev, [field]: value };

      // Calcular precio con descuento automáticamente
      if (field === "price" || field === "discount") {
        const price = parseFloat(field === "price" ? value : prev.price) || 0;
        const discount =
          parseFloat(field === "discount" ? value : prev.discount) || 0;

        if (price > 0 && discount > 0) {
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
        parseFloat(formData.discount) > 99.99)
    ) {
      newErrors.discount = "El descuento debe estar entre 0 y 99.99%";
    }

    if (!formData.stock || parseInt(formData.stock) < 0) {
      newErrors.stock = "La cantidad no puede ser negativa";
    }

    if (!formData.lotNumber.trim()) {
      newErrors.lotNumber = "El número de lote es obligatorio";
    }

    if (!formData.expirationDate) {
      newErrors.expirationDate = "La fecha de vencimiento es obligatoria";
    } else {
      const selectedDate = new Date(formData.expirationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (selectedDate <= today) {
        newErrors.expirationDate = "La fecha de vencimiento debe ser futura";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Usar la nueva acción que crea producto con stock en una sola transacción
      const response = await fetch("/api/stock", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "create_product_with_stock",
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          sku: formData.sku.trim(),
          price: parseFloat(formData.price),
          discount: formData.discount
            ? parseFloat(formData.discount)
            : undefined,
          discountedPrice: formData.discountedPrice
            ? parseFloat(formData.discountedPrice)
            : undefined,
          distributorId: distributorId,
          initialStock: parseInt(formData.stock),
          lotNumber: formData.lotNumber.trim(),
          expirationDate: formData.expirationDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Error al crear el producto con stock",
        );
      }

      const { productWithStock } = await response.json();
      console.log("Producto creado exitosamente:", productWithStock);

      // Notificar que se creó el producto exitosamente
      onProductCreated();

      // Cerrar modal y limpiar formulario
      handleClose();
    } catch (error) {
      console.error("Error creating product with stock:", error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Error desconocido al crear el producto",
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
      stock: "",
      lotNumber: "",
      expirationDate: "",
    });
    setErrors({});
    onClose();
  };

  // Generar fecha mínima (mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nuevo Producto</DialogTitle>
          <DialogDescription>
            Completa la información del nuevo producto y su stock inicial.
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
              <Label htmlFor="name">Nombre del producto *</Label>
              <Input
                id="name"
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
              <Label htmlFor="sku">SKU *</Label>
              <Input
                id="sku"
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
              <Label htmlFor="price">Precio *</Label>
              <Input
                id="price"
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
              <Label htmlFor="discount">Descuento (%)</Label>
              <Input
                id="discount"
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
            <div className="space-y-2">
              <Label htmlFor="discountedPrice">Precio con descuento</Label>
              <Input
                id="discountedPrice"
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

            {/* Stock inicial */}
            <div className="space-y-2">
              <Label htmlFor="stock">Stock inicial *</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => handleInputChange("stock", e.target.value)}
                placeholder="0"
                className={errors.stock ? "border-red-500" : ""}
              />
              {errors.stock && (
                <p className="text-sm text-red-500">{errors.stock}</p>
              )}
            </div>

            {/* Número de lote */}
            <div className="space-y-2">
              <Label htmlFor="lotNumber">Número de lote *</Label>
              <Input
                id="lotNumber"
                value={formData.lotNumber}
                onChange={(e) => handleInputChange("lotNumber", e.target.value)}
                placeholder="LOT-001"
                className={errors.lotNumber ? "border-red-500" : ""}
              />
              {errors.lotNumber && (
                <p className="text-sm text-red-500">{errors.lotNumber}</p>
              )}
            </div>

            {/* Fecha de vencimiento */}
            <div className="space-y-2">
              <Label htmlFor="expirationDate">Fecha de vencimiento *</Label>
              <Input
                id="expirationDate"
                type="date"
                min={minDate}
                value={formData.expirationDate}
                onChange={(e) =>
                  handleInputChange("expirationDate", e.target.value)
                }
                className={errors.expirationDate ? "border-red-500" : ""}
              />
              {errors.expirationDate && (
                <p className="text-sm text-red-500">{errors.expirationDate}</p>
              )}
            </div>
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
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
              {isSubmitting ? "Creando..." : "Crear Producto"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
