"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
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
import {
  Loader2,
  TrendingUp,
  Package,
  Search,
  Calendar,
  Check,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface AddStockModalProps {
  stockItems: StockItem[];
  isOpen: boolean;
  onClose(): void;
  onStockUpdated(): void;
}

export function AddStockModal(props: AddStockModalProps) {
  const { stockItems = [], isOpen, onClose, onStockUpdated } = props;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStockItemId, setSelectedStockItemId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [formData, setFormData] = useState({
    quantity: "",
    reason: "",
    newSku: "",
    expirationDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const searchInputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Validar que stockItems sea un array válido
  const safeStockItems = useMemo(() => {
    return Array.isArray(stockItems) ? stockItems : [];
  }, [stockItems]);

  const selectedStockItem = safeStockItems.find(
    (item) => item.id === selectedStockItemId,
  );

  // Filtrar productos basado en la búsqueda
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return safeStockItems.slice(0, 10); // Mostrar solo 10 inicialmente

    const query = searchQuery.toLowerCase();
    return safeStockItems
      .filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.sku.toLowerCase().includes(query) ||
          (item.description && item.description.toLowerCase().includes(query)),
      )
      .slice(0, 8); // Limitar a 8 resultados para mejor UX
  }, [safeStockItems, searchQuery]);

  // Manejar clicks fuera del componente para cerrar sugerencias
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !searchInputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
        setHighlightedIndex(-1);
      }
    };

    if (showSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showSuggestions]);

  // Manejar teclas de navegación
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredItems.length === 0) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredItems.length - 1 ? prev + 1 : 0,
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev > 0 ? prev - 1 : filteredItems.length - 1,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) {
          selectItem(filteredItems[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const selectItem = (item: StockItem) => {
    setSelectedStockItemId(item.id);
    setSearchQuery(item.name);
    setShowSuggestions(false);
    setHighlightedIndex(-1);

    // Limpiar error de producto
    if (errors.product) {
      setErrors((prev) => ({ ...prev, product: "" }));
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(true);
    setHighlightedIndex(-1);

    // Si se borra la búsqueda, limpiar selección
    if (!value.trim()) {
      setSelectedStockItemId("");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedStockItemId) {
      newErrors.product = "Debes seleccionar un producto";
    }

    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = "La cantidad debe ser mayor a 0";
    }

    if (!formData.reason.trim()) {
      newErrors.reason = "El motivo es obligatorio";
    }

    if (formData.newSku && formData.newSku.trim().length < 3) {
      newErrors.newSku = "El SKU debe tener al menos 3 caracteres";
    }

    if (formData.expirationDate) {
      const expirationDate = new Date(formData.expirationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expirationDate <= today) {
        newErrors.expirationDate =
          "La fecha de vencimiento debe ser posterior a hoy";
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
      const response = await fetch("/api/stock/movement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          inventoryItemId: selectedStockItemId,
          type: "INBOUND",
          quantity: parseInt(formData.quantity),
          reason: formData.reason.trim(),
          newSku: formData.newSku.trim() || undefined,
          expirationDate: formData.expirationDate || undefined,
        }),
      });

      if (!response.ok) {
        const errorData: { error?: string } = await response.json();
        throw new Error(errorData.error || "Error al agregar stock");
      }

      // Notificar que se actualizó el stock exitosamente
      onStockUpdated();

      // Cerrar modal y limpiar formulario
      handleClose();
    } catch (error) {
      console.error("Error adding stock:", error);
      setErrors({
        submit:
          error instanceof Error
            ? error.message
            : "Error desconocido al agregar stock",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedStockItemId("");
    setSearchQuery("");
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    setFormData({
      quantity: "",
      reason: "",
      newSku: "",
      expirationDate: "",
    });
    setErrors({});
    onClose();
  };

  // Generar fecha mínima (mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  const newStock = selectedStockItem
    ? selectedStockItem.stock + (parseInt(formData.quantity) || 0)
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Agregar Stock
          </DialogTitle>
          <DialogDescription>
            Selecciona un producto y agrega inventario. Se registrará como
            entrada de stock.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error general */}
          {errors.submit && (
            <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md">
              {errors.submit}
            </div>
          )}

          {/* Campo de búsqueda integrado */}
          <div className="space-y-2 relative">
            <Label htmlFor="search">Buscar y seleccionar producto *</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                id="search"
                type="text"
                placeholder="Escribir nombre, SKU o descripción del producto..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                className={cn(
                  "pl-10",
                  errors.product && "border-red-500",
                  selectedStockItem && "border-green-500 bg-green-50",
                )}
                autoComplete="off"
              />
              {selectedStockItem && (
                <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600" />
              )}
            </div>

            {/* Sugerencias desplegables */}
            {showSuggestions && (
              <div
                ref={suggestionsRef}
                className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto"
              >
                {filteredItems.length === 0 ? (
                  <div className="p-4 text-center text-muted-foreground">
                    <Search className="h-6 w-6 mx-auto mb-2" />
                    <p>No se encontraron productos</p>
                    {searchQuery && (
                      <p className="text-xs">
                        Intenta con otro término de búsqueda
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="py-1">
                    {filteredItems.map((item, index) => (
                      <div
                        key={item.id}
                        onClick={() => selectItem(item)}
                        className={cn(
                          "px-4 py-3 cursor-pointer hover:bg-gray-50 border-l-4 transition-colors",
                          highlightedIndex === index &&
                            "bg-blue-50 border-l-blue-500",
                          selectedStockItem?.id === item.id &&
                            "bg-green-50 border-l-green-500",
                          highlightedIndex !== index &&
                            selectedStockItem?.id !== item.id &&
                            "border-l-transparent",
                        )}
                        onMouseEnter={() => setHighlightedIndex(index)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Package className="h-4 w-4 text-gray-500 flex-shrink-0" />
                              <span className="font-medium text-sm truncate">
                                {item.name}
                              </span>
                              {selectedStockItem?.id === item.id && (
                                <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground space-y-0.5">
                              <div>
                                SKU: {item.sku} • Lote: {item.lotNumber}
                              </div>
                              <div className="flex items-center gap-4">
                                <span>
                                  Stock:{" "}
                                  <span className="font-medium">
                                    {item.stock}
                                  </span>
                                </span>
                                <span>
                                  Vence:{" "}
                                  {new Date(
                                    item.expirationDate,
                                  ).toLocaleDateString("es-ES")}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {errors.product && (
              <p className="text-sm text-red-500">{errors.product}</p>
            )}
          </div>

          {/* Información del producto seleccionado */}
          {selectedStockItem && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border border-green-200 space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">
                  {selectedStockItem.name}
                </span>
                <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                  Seleccionado
                </span>
              </div>
              <div className="text-sm text-gray-700 space-y-1">
                <div>
                  SKU:{" "}
                  <span className="font-medium">{selectedStockItem.sku}</span> •
                  Lote:{" "}
                  <span className="font-medium">
                    {selectedStockItem.lotNumber}
                  </span>
                </div>
                <div>
                  Vencimiento actual:{" "}
                  <span className="font-medium">
                    {new Date(
                      selectedStockItem.expirationDate,
                    ).toLocaleDateString("es-ES")}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between pt-2 border-t border-green-200">
                <div className="text-sm">
                  <span className="text-gray-600">Stock actual: </span>
                  <span className="font-bold text-lg">
                    {selectedStockItem.stock}
                  </span>
                  <span className="text-gray-600"> unidades</span>
                </div>
                {formData.quantity && parseInt(formData.quantity) > 0 && (
                  <div className="text-sm text-right">
                    <span className="text-gray-600">Stock después: </span>
                    <span className="font-bold text-green-600 text-lg">
                      {newStock}
                    </span>
                    <span className="text-green-600"> unidades</span>
                    <div className="text-green-600 font-medium">
                      +{formData.quantity} agregadas
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Grid con cantidad y SKU */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Cantidad a agregar */}
            <div className="space-y-2">
              <Label htmlFor="add-quantity">Cantidad a agregar *</Label>
              <Input
                id="add-quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange("quantity", e.target.value)}
                placeholder="Ingresa la cantidad"
                className={errors.quantity ? "border-red-500" : ""}
              />
              {errors.quantity && (
                <p className="text-sm text-red-500">{errors.quantity}</p>
              )}
            </div>

            {/* Nuevo SKU (opcional) */}
            <div className="space-y-2">
              <Label htmlFor="new-sku">Nuevo código SKU (opcional)</Label>
              <Input
                id="new-sku"
                type="text"
                value={formData.newSku}
                onChange={(e) => handleInputChange("newSku", e.target.value)}
                placeholder="Ej: SKU-2024-001"
                className={errors.newSku ? "border-red-500" : ""}
              />
              {errors.newSku && (
                <p className="text-sm text-red-500">{errors.newSku}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Si especificas un SKU, se creará una nueva entrada de inventario
              </p>
            </div>
          </div>

          {/* Fecha de vencimiento */}
          <div className="space-y-2">
            <Label
              htmlFor="expiration-date"
              className="flex items-center gap-2"
            >
              <Calendar className="h-4 w-4" />
              Fecha de vencimiento (opcional)
            </Label>
            <Input
              id="expiration-date"
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
            <p className="text-xs text-muted-foreground">
              Si no especificas fecha, se usará la fecha del producto
              seleccionado
            </p>
          </div>

          {/* Motivo */}
          <div className="space-y-2">
            <Label htmlFor="add-reason">Motivo *</Label>
            <Textarea
              id="add-reason"
              value={formData.reason}
              onChange={(e) => handleInputChange("reason", e.target.value)}
              placeholder="Ej: Compra de mercadería, Reposición de stock, Corrección de inventario..."
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
              disabled={isSubmitting}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Agregando..." : "Agregar Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
