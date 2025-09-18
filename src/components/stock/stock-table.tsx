"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Edit,
  TrendingUp,
  TrendingDown,
  CheckSquare,
  Square,
  AlertTriangle,
  Calendar,
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

interface StockTableProps {
  stockItems: StockItem[];
  showBulkActions?: boolean;
  selectedItems?: string[];
  onItemSelectionChange?: (itemId: string, isSelected: boolean) => void;
  onSelectAllChange?: (isSelected: boolean) => void;
  onStockMovement?: (stockItem: StockItem) => void;
}

export function StockTable({
  stockItems,
  showBulkActions = false,
  selectedItems = [],
  onItemSelectionChange,
  onSelectAllChange,
  onStockMovement,
}: StockTableProps) {
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  const handleViewItem = (item: StockItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsDetailModalOpen(false);
    setSelectedItem(null);
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

  const getStockBadge = (stock: number) => {
    if (stock === 0) {
      return <Badge variant="destructive">Sin Stock</Badge>;
    } else if (stock <= 5) {
      return (
        <Badge variant="secondary" className="bg-orange-100 text-orange-800">
          Stock Crítico
        </Badge>
      );
    } else if (stock <= 10) {
      return (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          Stock Bajo
        </Badge>
      );
    } else {
      return (
        <Badge variant="secondary" className="bg-green-100 text-green-800">
          Stock Normal
        </Badge>
      );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  const getAvailableActions = (item: StockItem) => {
    const actions = [
      // Ver detalle - siempre disponible
      <Button
        key="view"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleViewItem(item)}
        title="Ver detalle"
      >
        <Eye className="h-4 w-4" />
      </Button>,
      // Editar stock
      <Button
        key="edit"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        onClick={() => onStockMovement?.(item)}
        title="Ajustar stock"
      >
        <Edit className="h-4 w-4" />
      </Button>,
    ];

    // Agregar entrada de stock
    actions.push(
      <Button
        key="inbound"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
        onClick={() => onStockMovement?.(item)}
        title="Entrada de stock"
      >
        <TrendingUp className="h-4 w-4" />
      </Button>,
    );

    // Salida de stock (solo si hay stock)
    if (item.stock > 0) {
      actions.push(
        <Button
          key="outbound"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => onStockMovement?.(item)}
          title="Salida de stock"
        >
          <TrendingDown className="h-4 w-4" />
        </Button>,
      );
    }

    return actions;
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
              <TableHead className="font-semibold">Precio</TableHead>
              <TableHead className="font-semibold text-center">Stock</TableHead>
              <TableHead className="font-semibold">Lote</TableHead>
              <TableHead className="font-semibold">Vencimiento</TableHead>
              <TableHead className="font-semibold text-center">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {stockItems.map((item) => (
              <TableRow
                key={item.id}
                className={`hover:bg-muted/50 ${
                  selectedItems.includes(item.id) ? "bg-blue-50" : ""
                }`}
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
                        <CheckSquare className="h-4 w-4" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                )}
                <TableCell className="min-w-[200px]">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-muted-foreground line-clamp-1">
                        {item.description}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                <TableCell>
                  <div className="flex flex-col">
                    {item.discountedPrice ? (
                      <>
                        <span className="line-through text-sm text-muted-foreground">
                          {formatCurrency(item.price)}
                        </span>
                        <span className="font-medium text-green-600">
                          {formatCurrency(item.discountedPrice)}
                        </span>
                      </>
                    ) : (
                      <span className="font-medium">
                        {formatCurrency(item.price)}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex flex-col items-center gap-1">
                    <span className="text-lg font-semibold">{item.stock}</span>
                    {getStockBadge(item.stock)}
                  </div>
                </TableCell>
                <TableCell className="font-mono text-sm">
                  {item.lotNumber}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    <span className="text-sm">
                      {formatDate(item.expirationDate)}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    {getAvailableActions(item)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <StockDetailModal
        stockItem={selectedItem}
        isOpen={isDetailModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
