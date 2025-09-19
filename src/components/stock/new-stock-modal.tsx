"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
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
import { Loader2, Package, Search, Plus } from "lucide-react";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Product {
  id: string;
  name: string;
  sku: string;
  description?: string | null;
  price: number;
  discountedPrice?: number;
}

interface NewStockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStockCreated: () => void;
  distributorId: string;
}

export function NewStockModal({
  isOpen,
  onClose,
  onStockCreated,
  distributorId,
}: NewStockModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");

  const [formData, setFormData] = useState({
    initialStock: "",
    lotNumber: "",
    expirationDate: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cargar productos cuando se abre el modal
  const loadProducts = useCallback(async () => {
    setIsLoadingProducts(true);
    try {
      const response = await fetch(
        `/api/stock/products?distributorId=${distributorId}`,
      );
      if (!response.ok) {
        throw new Error("Error al cargar productos");
      }
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Error loading products:", error);
      setErrors({ submit: "Error al cargar los productos" });
    } finally {
      setIsLoadingProducts(false);
    }
  }, [distributorId]);

  useEffect(() => {
    if (isOpen) {
      loadProducts();
    }
  }, [isOpen, loadProducts]);

  // Filtrar productos basado en la búsqueda
  const filteredProducts = useMemo(() => {
    if (!productSearchQuery.trim()) return products;

    const query = productSearchQuery.toLowerCase();
    return products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        (product.description &&
          product.description.toLowerCase().includes(query)),
    );
  }, [products, productSearchQuery]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Limpiar error cuando el usuario empiece a escribir
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!selectedProduct) {
      newErrors.product = "Debes seleccionar un producto";
    }

    if (!formData.initialStock || parseInt(formData.initialStock) < 0) {
      newErrors.initialStock = "El stock inicial debe ser mayor o igual a 0";
    }

    if (!formData.lotNumber.trim()) {
      newErrors.lotNumber = "El número de lote es obligatorio";
    }

    if (!formData.expirationDate) {
      newErrors.expirationDate = "La fecha de vencimiento es obligatoria";
    } else {
      const expDate = new Date(formData.expirationDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (expDate <= today) {
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
      const response = await fetch("/api/stock/add-existing", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: selectedProduct!.id,
          distributorId: distributorId,
          initialStock: parseInt(formData.initialStock),
          lotNumber: formData.lotNumber.trim(),
          expirationDate: formData.expirationDate,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al agregar stock");
      }

      // Notificar que se creó el stock exitosamente
      onStockCreated();

      // Cerrar modal
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
    setFormData({
      initialStock: "",
      lotNumber: "",
      expirationDate: "",
    });
    setSelectedProduct(null);
    setProductSearchQuery("");
    setErrors({});
    onClose();
  };

  // Generar fecha mínima (mañana)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const minDate = tomorrow.toISOString().split("T")[0];

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nuevo Stock
          </DialogTitle>
          <DialogDescription>
            Agrega stock a un producto existente creando un nuevo lote de
            inventario.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Error general */}
          {errors.submit && (
            <div className="p-3 text-sm text-red-800 bg-red-100 border border-red-200 rounded-md">
              {errors.submit}
            </div>
          )}

          {/* Selector de producto */}
          <div className="space-y-2">
            <Label>Producto *</Label>
            <Popover
              open={isProductSelectorOpen}
              onOpenChange={setIsProductSelectorOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={isProductSelectorOpen}
                  className={`w-full justify-between ${errors.product ? "border-red-500" : ""}`}
                  disabled={isLoadingProducts}
                >
                  {selectedProduct ? (
                    <div className="flex items-center gap-2 flex-1 text-left">
                      <Package className="h-4 w-4" />
                      <div>
                        <span className="font-medium">
                          {selectedProduct.name}
                        </span>
                        <span className="text-sm text-muted-foreground ml-2">
                          ({selectedProduct.sku})
                        </span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground flex items-center gap-2">
                      {isLoadingProducts ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Cargando productos...
                        </>
                      ) : (
                        <>
                          <Search className="h-4 w-4" />
                          Buscar producto...
                        </>
                      )}
                    </span>
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Buscar producto por nombre o SKU..."
                    value={productSearchQuery}
                    onValueChange={setProductSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No se encontraron productos.</CommandEmpty>
                    <CommandGroup>
                      {filteredProducts.map((product) => (
                        <CommandItem
                          key={product.id}
                          value={`${product.name} ${product.sku}`}
                          onSelect={() => {
                            setSelectedProduct(product);
                            setIsProductSelectorOpen(false);
                            if (errors.product) {
                              setErrors((prev) => ({ ...prev, product: "" }));
                            }
                          }}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedProduct?.id === product.id
                                ? "opacity-100"
                                : "opacity-0",
                            )}
                          />
                          <div className="flex flex-col flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {product.name}
                              </span>
                              <span className="text-sm text-muted-foreground">
                                ({product.sku})
                              </span>
                            </div>
                            {product.description && (
                              <span className="text-xs text-muted-foreground line-clamp-1">
                                {product.description}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
            {errors.product && (
              <p className="text-sm text-red-500">{errors.product}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Stock inicial */}
            <div className="space-y-2">
              <Label htmlFor="initialStock">Stock inicial *</Label>
              <Input
                id="initialStock"
                type="number"
                min="0"
                value={formData.initialStock}
                onChange={(e) =>
                  handleInputChange("initialStock", e.target.value)
                }
                placeholder="0"
                className={errors.initialStock ? "border-red-500" : ""}
              />
              {errors.initialStock && (
                <p className="text-sm text-red-500">{errors.initialStock}</p>
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
            <div className="space-y-2 md:col-span-2">
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

          {/* Información del producto seleccionado */}
          {selectedProduct && (
            <div className="bg-blue-50 p-4 rounded-lg space-y-2">
              <div className="flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-800">
                  Producto seleccionado
                </span>
              </div>
              <div className="text-sm space-y-1">
                <div>
                  <span className="font-medium">Nombre:</span>{" "}
                  {selectedProduct.name}
                </div>
                <div>
                  <span className="font-medium">SKU:</span>{" "}
                  {selectedProduct.sku}
                </div>
                {selectedProduct.description && (
                  <div>
                    <span className="font-medium">Descripción:</span>{" "}
                    {selectedProduct.description}
                  </div>
                )}
                <div>
                  <span className="font-medium">Precio:</span>
                  <span className="ml-1">
                    {selectedProduct.discountedPrice
                      ? `$${selectedProduct.discountedPrice} (desc. desde $${selectedProduct.price})`
                      : `$${selectedProduct.price}`}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isSubmitting ? "Creando..." : "Crear Stock"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
