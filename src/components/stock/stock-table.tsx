"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Plus,
  Minus,
  CheckSquare,
  Square,
  AlertTriangle,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StockDetailModal } from "./stock-detail-modal";
import { StockAdjustmentModal } from "./stock-adjustment-modal";

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

interface StockTableProps {
  stockItems: StockItem[];
  showBulkActions?: boolean;
  selectedItems?: string[];
  onItemSelectionChange?: (itemId: string, isSelected: boolean) => void;
  onSelectAllChange?: (isSelected: boolean) => void;
}

function getStockBadge(item: StockItem) {
  if (!item.isActive) {
    return <Badge variant="secondary">Inactivo</Badge>;
  }

  if (item.totalStock === 0) {
    return <Badge variant="destructive">Sin stock</Badge>;
  }

  if (item.isLowStock) {
    return (
      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Stock bajo
      </Badge>
    );
  }

  return (
    <Badge variant="secondary" className="bg-green-100 text-green-800">
      En stock
    </Badge>
  );
}

function getExpirationBadge(item: StockItem) {
  if (item.isExpiring) {
    return (
      <Badge variant="secondary" className="bg-red-100 text-red-800">
        Próximo a vencer
      </Badge>
    );
  }
  return null;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function StockTable({
  stockItems,
  showBulkActions = false,
  selectedItems = [],
  onItemSelectionChange,
  onSelectAllChange,
}: StockTableProps) {
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [adjustmentModal, setAdjustmentModal] = useState<{
    isOpen: boolean;
    item: StockItem | null;
    type: "increase" | "decrease";
  }>({ isOpen: false, item: null, type: "increase" });

  const handleViewItem = (item: StockItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
  };

  const handleStockAdjustment = (
    item: StockItem,
    type: "increase" | "decrease",
  ) => {
    setAdjustmentModal({
      isOpen: true,
      item,
      type,
    });
  };

  const handleCloseAdjustmentModal = () => {
    setAdjustmentModal({ isOpen: false, item: null, type: "increase" });
  };

  const handleConfirmAdjustment = async (quantity: number, reason: string) => {
    if (!adjustmentModal.item) return;

    try {
      // Llamar a la API para ajustar stock
      const response = await fetch(
        `/api/stock/${adjustmentModal.item.id}/adjust`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            quantity,
            type: adjustmentModal.type,
            reason,
          }),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al ajustar stock");
      }

      const result = await response.json();
      console.log(`Stock ajustado exitosamente:`, result.message);

      handleCloseAdjustmentModal();
      // Recargar la página para reflejar los cambios
      window.location.reload();
    } catch (error) {
      console.error("Error al ajustar stock:", error);
      alert(
        `Error al ajustar el stock: ${error instanceof Error ? error.message : "Error desconocido"}`,
      );
    }
  };

  const getAvailableActions = (item: StockItem) => {
    const actions = [
      // Ver detalles - siempre disponible
      <Button
        key="view"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleViewItem(item)}
        title="Ver detalles"
      >
        <Eye className="h-4 w-4" />
      </Button>,
    ];

    // Solo mostrar acciones de stock si el producto está activo
    if (item.isActive) {
      actions.push(
        // Aumentar stock
        <Button
          key="increase"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={() => handleStockAdjustment(item, "increase")}
          title="Aumentar stock"
        >
          <Plus className="h-4 w-4" />
        </Button>,
        // Reducir stock
        <Button
          key="decrease"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          onClick={() => handleStockAdjustment(item, "decrease")}
          title="Reducir stock"
          disabled={item.totalStock === 0}
        >
          <Minus className="h-4 w-4" />
        </Button>,
      );
    }

    return actions;
  };

  const toggleItemSelection = (itemId: string) => {
    if (onItemSelectionChange) {
      onItemSelectionChange(itemId, !selectedItems.includes(itemId));
    }
  };

  const toggleSelectAll = () => {
    if (onSelectAllChange) {
      onSelectAllChange(selectedItems.length !== stockItems.length);
    }
  };

  return (
    <>
      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              {showBulkActions && (
                <TableHead className="w-12">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleSelectAll}
                    className="h-8 w-8 p-0"
                  >
                    {selectedItems.length === stockItems.length &&
                    stockItems.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
              )}
              <TableHead className="font-semibold">Producto</TableHead>
              <TableHead className="font-semibold">SKU</TableHead>
              <TableHead className="font-semibold text-right">Precio</TableHead>
              <TableHead className="font-semibold text-center">Stock</TableHead>
              <TableHead className="font-semibold">Lote</TableHead>
              <TableHead className="font-semibold">Vencimiento</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold text-center">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockItems.map((item) => (
              <TableRow
                key={item.id}
                className={`hover:bg-muted/50 ${selectedItems.includes(item.id) ? "bg-blue-50" : ""}`}
              >
                {showBulkActions && (
                  <TableCell className="w-12">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleItemSelection(item.id)}
                      className="h-8 w-8 p-0"
                    >
                      {selectedItems.includes(item.id) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                )}
                <TableCell className="font-medium">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    {item.isExpiring && (
                      <div className="mt-1">{getExpirationBadge(item)}</div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(item.price)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span
                      className={`font-semibold ${
                        item.totalStock === 0
                          ? "text-red-600"
                          : item.isLowStock
                            ? "text-orange-600"
                            : "text-green-600"
                      }`}
                    >
                      {item.totalStock}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      unidades
                    </span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {item.lotNumber}
                </TableCell>
                <TableCell>{formatDate(item.expirationDate)}</TableCell>
                <TableCell>{getStockBadge(item)}</TableCell>
                <TableCell className="text-center">
                  <div className="flex gap-1 justify-center">
                    {getAvailableActions(item)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <StockDetailModal
        item={selectedItem}
        isOpen={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />

      <StockAdjustmentModal
        item={adjustmentModal.item}
        isOpen={adjustmentModal.isOpen}
        type={adjustmentModal.type}
        onClose={handleCloseAdjustmentModal}
        onConfirm={handleConfirmAdjustment}
      />
    </>
  );
}
