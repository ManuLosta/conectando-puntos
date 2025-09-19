"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Eye,
  Edit3,
  TrendingUp,
  TrendingDown,
  CheckSquare,
  Square,
  Trash2,
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
import { EditProductModal } from "./edit-product-modal";
import { ReduceStockModal } from "./reduce-stock-modal";
import { IncreaseStockModal } from "./increase-stock-modal";
import { DeleteProductModal } from "./delete-product-modal";

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
  distributorId: string;
  showBulkActions?: boolean;
  selectedItems?: string[];
  onItemSelectionChange?: (itemId: string, isSelected: boolean) => void;
  onSelectAllChange?: (isSelected: boolean) => void;
  onStockUpdated?: () => void;
}

export function StockTable({
  stockItems,
  distributorId,
  showBulkActions = false,
  selectedItems = [],
  onItemSelectionChange,
  onSelectAllChange,
  onStockUpdated,
}: StockTableProps) {
  const [selectedItem, setSelectedItem] = useState<StockItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [isReduceStockModalOpen, setIsReduceStockModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    productId: string;
    productName: string;
  }>({
    isOpen: false,
    productId: "",
    productName: "",
  });

  const handleViewItem = (item: StockItem) => {
    setSelectedItem(item);
    setIsDetailModalOpen(true);
  };

  const handleEditProduct = (item: StockItem) => {
    setSelectedItem(item);
    setIsEditModalOpen(true);
  };

  const handleAddStock = (item: StockItem) => {
    setSelectedItem(item);
    setIsAddStockModalOpen(true);
  };

  const handleReduceStock = (item: StockItem) => {
    setSelectedItem(item);
    setIsReduceStockModalOpen(true);
  };

  const handleDeleteClick = (productId: string, productName: string) => {
    setDeleteModal({
      isOpen: true,
      productId,
      productName,
    });
  };

  const handleDeleteSuccess = () => {
    if (onStockUpdated) {
      onStockUpdated();
    }
  };

  const handleCloseModals = () => {
    setIsDetailModalOpen(false);
    setIsEditModalOpen(false);
    setIsAddStockModalOpen(false);
    setIsReduceStockModalOpen(false);
    setSelectedItem(null);
  };

  const handleStockUpdated = () => {
    if (onStockUpdated) {
      onStockUpdated();
    }
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
      // Modificar producto
      <Button
        key="edit"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
        onClick={() => handleEditProduct(item)}
        title="Modificar producto"
      >
        <Edit3 className="h-4 w-4" />
      </Button>,
      // Agregar stock
      <Button
        key="add-stock"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
        onClick={() => handleAddStock(item)}
        title="Agregar stock"
      >
        <TrendingUp className="h-4 w-4" />
      </Button>,
    ];

    // Disminuir stock (solo si hay stock)
    if (item.stock > 0) {
      actions.push(
        <Button
          key="reduce-stock"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => handleReduceStock(item)}
          title="Disminuir stock"
        >
          <TrendingDown className="h-4 w-4" />
        </Button>,
      );
    }

    // Eliminar producto
    actions.push(
      <Button
        key="delete"
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={() => handleDeleteClick(item.productId, item.name)}
        title="Eliminar producto"
      >
        <Trash2 className="h-4 w-4" />
      </Button>,
    );

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

      {/* Modales */}
      <StockDetailModal
        stockItem={selectedItem}
        isOpen={isDetailModalOpen}
        onClose={handleCloseModals}
      />

      <EditProductModal
        stockItem={selectedItem}
        isOpen={isEditModalOpen}
        onClose={handleCloseModals}
        onProductUpdated={handleStockUpdated}
      />

      <IncreaseStockModal
        stockItem={selectedItem}
        isOpen={isAddStockModalOpen}
        onClose={handleCloseModals}
        onStockUpdated={handleStockUpdated}
      />

      <ReduceStockModal
        stockItem={selectedItem}
        isOpen={isReduceStockModalOpen}
        onClose={handleCloseModals}
        onStockUpdated={handleStockUpdated}
      />

      <DeleteProductModal
        productId={deleteModal.productId}
        productName={deleteModal.productName}
        distributorId={distributorId}
        isOpen={deleteModal.isOpen}
        onOpenChange={(open) =>
          setDeleteModal((prev) => ({ ...prev, isOpen: open }))
        }
        onDelete={handleDeleteSuccess}
      />
    </>
  );
}
