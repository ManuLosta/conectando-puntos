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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  Edit,
  RefreshCw,
  Package,
  AlertTriangle,
  X,
} from "lucide-react";

interface StockItem {
  id: string;
  productId: string;
  name: string;
  sku: string;
  description?: string;
  price: number;
  discountedPrice?: number;
  stock: number;
  lotNumber: string;
  expirationDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface StockMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  stockItem: StockItem | null;
  onSave: (movementData: {
    inventoryItemId: string;
    type: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "TRANSFER";
    quantity: number;
    reason?: string;
  }) => void;
}

type MovementType = "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "TRANSFER";

const movementTypes: {
  value: MovementType;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  color: string;
}[] = [
  {
    value: "INBOUND",
    label: "Entrada de Stock",
    icon: TrendingUp,
    description: "Agregar productos al inventario",
    color: "text-green-600",
  },
  {
    value: "OUTBOUND",
    label: "Salida de Stock",
    icon: TrendingDown,
    description: "Remover productos del inventario",
    color: "text-red-600",
  },
  {
    value: "ADJUSTMENT",
    label: "Ajuste de Inventario",
    icon: Edit,
    description: "Corregir cantidad por diferencias de inventario",
    color: "text-blue-600",
  },
  {
    value: "TRANSFER",
    label: "Transferencia",
    icon: RefreshCw,
    description: "Mover productos entre ubicaciones",
    color: "text-purple-600",
  },
];

export function StockMovementModal({
  isOpen,
  onClose,
  stockItem,
  onSave,
}: StockMovementModalProps) {
  const [movementType, setMovementType] = useState<MovementType>("INBOUND");
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>("");

  const selectedMovementType = movementTypes.find(
    (type) => type.value === movementType,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!stockItem) return;

    // Validaciones
    if (quantity <= 0) {
      alert("La cantidad debe ser mayor a 0");
      return;
    }

    if (movementType === "OUTBOUND" && quantity > stockItem.stock) {
      alert(`No hay suficiente stock. Disponible: ${stockItem.stock}`);
      return;
    }

    const movementData = {
      inventoryItemId: stockItem.id,
      type: movementType,
      quantity: movementType === "ADJUSTMENT" ? quantity : Math.abs(quantity),
      reason: reason || undefined,
    };

    onSave(movementData);
    handleClose();
  };

  const handleClose = () => {
    // Resetear formulario
    setMovementType("INBOUND");
    setQuantity(1);
    setReason("");
    onClose();
  };

  const calculateNewStock = () => {
    if (!stockItem) return 0;

    switch (movementType) {
      case "INBOUND":
        return stockItem.stock + quantity;
      case "OUTBOUND":
        return Math.max(0, stockItem.stock - quantity);
      case "ADJUSTMENT":
        return quantity;
      case "TRANSFER":
        return Math.max(0, stockItem.stock - quantity);
      default:
        return stockItem.stock;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!stockItem) return null;

  const newStock = calculateNewStock();
  const stockDifference = newStock - stockItem.stock;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl font-semibold flex items-center gap-2">
              <Package className="h-6 w-6" />
              Movimiento de Stock
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Información del Producto */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">
                Información del Producto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Producto</p>
                  <p className="font-medium">{stockItem.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-mono">{stockItem.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock Actual</p>
                  <p className="text-2xl font-bold">{stockItem.stock}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Precio</p>
                  <p className="font-medium">
                    {formatCurrency(
                      stockItem.discountedPrice || stockItem.price,
                    )}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tipo de Movimiento */}
          <div className="space-y-3">
            <Label htmlFor="movement-type">Tipo de Movimiento *</Label>
            <Select
              value={movementType}
              onValueChange={(value) => setMovementType(value as MovementType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {movementTypes.map((type) => {
                  const Icon = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <Icon className={`h-4 w-4 ${type.color}`} />
                        <div>
                          <p className="font-medium">{type.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {type.description}
                          </p>
                        </div>
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            {selectedMovementType && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <selectedMovementType.icon
                  className={`h-5 w-5 ${selectedMovementType.color}`}
                />
                <p className="text-sm text-muted-foreground">
                  {selectedMovementType.description}
                </p>
              </div>
            )}
          </div>

          {/* Cantidad */}
          <div className="space-y-3">
            <Label htmlFor="quantity">
              {movementType === "ADJUSTMENT"
                ? "Nueva Cantidad *"
                : "Cantidad *"}
            </Label>
            <Input
              id="quantity"
              type="number"
              min={movementType === "ADJUSTMENT" ? "0" : "1"}
              max={
                movementType === "OUTBOUND"
                  ? stockItem.stock.toString()
                  : undefined
              }
              value={quantity}
              onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
              placeholder={
                movementType === "ADJUSTMENT"
                  ? "Ingrese la cantidad final"
                  : "Cantidad a mover"
              }
              className="text-lg"
            />
            {movementType === "OUTBOUND" && quantity > stockItem.stock && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-4 w-4" />
                <p className="text-sm">
                  Stock insuficiente. Disponible: {stockItem.stock}
                </p>
              </div>
            )}
          </div>

          {/* Preview del resultado */}
          <Card className="border-2 border-dashed">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Vista Previa del Cambio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Stock Actual</p>
                  <p className="text-2xl font-bold">{stockItem.stock}</p>
                </div>
                <div className="flex items-center gap-2">
                  {stockDifference > 0 ? (
                    <Badge className="bg-green-100 text-green-800">
                      +{stockDifference}
                    </Badge>
                  ) : stockDifference < 0 ? (
                    <Badge className="bg-red-100 text-red-800">
                      {stockDifference}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Sin cambios</Badge>
                  )}
                  <span className="text-muted-foreground">→</span>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Nuevo Stock</p>
                  <p className="text-2xl font-bold text-blue-600">{newStock}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Razón */}
          <div className="space-y-3">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea
              id="reason"
              placeholder="Describe el motivo del movimiento de stock..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
            />
          </div>

          {/* Botones de acción */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                quantity <= 0 ||
                (movementType === "OUTBOUND" && quantity > stockItem.stock)
              }
              className="bg-blue-600 hover:bg-blue-700"
            >
              {selectedMovementType?.icon && (
                <selectedMovementType.icon className="h-4 w-4 mr-2" />
              )}
              Confirmar Movimiento
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
