"use client";

import React, { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package,
  DollarSign,
  Calendar,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AddStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FormData {
  productName: string;
  sku: string;
  price: string;
  description: string;
  stock: string;
  lotNumber: string;
  expirationDate: string;
}

const initialFormData: FormData = {
  productName: "",
  sku: "",
  price: "",
  description: "",
  stock: "",
  lotNumber: "",
  expirationDate: "",
};

const AddStockModal: React.FC<AddStockModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setError(""); // Limpiar error cuando el usuario edita
  };

  const validateForm = (): string | null => {
    if (!formData.productName.trim()) {
      return "El nombre del producto es requerido";
    }
    if (!formData.sku.trim()) {
      return "El SKU es requerido";
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      return "El precio debe ser mayor a 0";
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      return "El stock debe ser 0 o mayor";
    }
    if (!formData.lotNumber.trim()) {
      return "El número de lote es requerido";
    }
    if (!formData.expirationDate) {
      return "La fecha de vencimiento es requerida";
    }

    // Validar que la fecha de vencimiento no sea en el pasado
    const expirationDate = new Date(formData.expirationDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (expirationDate < today) {
      return "La fecha de vencimiento no puede ser en el pasado";
    }

    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/stock/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productName: formData.productName.trim(),
          sku: formData.sku.trim().toUpperCase(),
          price: parseFloat(formData.price),
          description: formData.description.trim() || null,
          stock: parseInt(formData.stock),
          lotNumber: formData.lotNumber.trim(),
          expirationDate: formData.expirationDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Error al agregar stock");
      }

      setSuccess(true);
      setTimeout(() => {
        handleClose();
        onSuccess();
      }, 1500);
    } catch (error) {
      console.error("Error al agregar stock:", error);
      setError(error instanceof Error ? error.message : "Error desconocido");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData(initialFormData);
      setError("");
      setSuccess(false);
      onClose();
    }
  };

  // Generar fecha mínima (hoy)
  const today = new Date().toISOString().split("T")[0];

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              ¡Stock agregado exitosamente!
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              El producto se ha agregado correctamente al inventario.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
            <Package className="h-6 w-6" />
            Agregar Nuevo Stock
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error Alert */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Información del Producto */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Package className="h-5 w-5" />
                Información del Producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="productName">Nombre del Producto *</Label>
                  <Input
                    id="productName"
                    value={formData.productName}
                    onChange={(e) =>
                      handleInputChange("productName", e.target.value)
                    }
                    placeholder="Ej: Leche Entera La Serenísima"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="sku">SKU *</Label>
                  <Input
                    id="sku"
                    value={formData.sku}
                    onChange={(e) =>
                      handleInputChange("sku", e.target.value.toUpperCase())
                    }
                    placeholder="Ej: LSE-001"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="description">Descripción (opcional)</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) =>
                    handleInputChange("description", e.target.value)
                  }
                  placeholder="Descripción detallada del producto"
                  rows={3}
                  disabled={isSubmitting}
                />
              </div>
            </CardContent>
          </Card>

          {/* Precio y Stock */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Precio y Cantidad
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price">Precio Unitario *</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                      $
                    </span>
                    <Input
                      id="price"
                      type="number"
                      step="0.01"
                      min="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        handleInputChange("price", e.target.value)
                      }
                      placeholder="0.00"
                      className="pl-6"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="stock">Cantidad Inicial *</Label>
                  <Input
                    id="stock"
                    type="number"
                    min="0"
                    value={formData.stock}
                    onChange={(e) => handleInputChange("stock", e.target.value)}
                    placeholder="0"
                    disabled={isSubmitting}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Información del Lote */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Información del Lote
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="lotNumber">Número de Lote *</Label>
                  <Input
                    id="lotNumber"
                    value={formData.lotNumber}
                    onChange={(e) =>
                      handleInputChange("lotNumber", e.target.value)
                    }
                    placeholder="Ej: LT202401"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <Label htmlFor="expirationDate">Fecha de Vencimiento *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="expirationDate"
                      type="date"
                      min={today}
                      value={formData.expirationDate}
                      onChange={(e) =>
                        handleInputChange("expirationDate", e.target.value)
                      }
                      className="pl-10"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botones de Acción */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Agregar Stock
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export { AddStockModal };
