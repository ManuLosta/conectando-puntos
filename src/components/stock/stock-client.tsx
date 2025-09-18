"use client";

import { useState } from "react";
import { StockTable } from "./stock-table";

interface StockClientProps {
  stockItems: Array<{
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
  }>;
  showBulkActions?: boolean;
}

export function StockClient({
  stockItems,
  showBulkActions = false,
}: StockClientProps) {
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const handleItemSelection = (itemId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems([...selectedItems, itemId]);
    } else {
      setSelectedItems(selectedItems.filter((id) => id !== itemId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedItems(stockItems.map((item) => item.id));
    } else {
      setSelectedItems([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header simplificado */}
      <div>
        <h3 className="text-lg font-medium">
          {stockItems.length}{" "}
          {stockItems.length === 1 ? "producto" : "productos"}
        </h3>
      </div>

      {/* Tabla de stock */}
      <StockTable
        stockItems={stockItems}
        showBulkActions={showBulkActions}
        selectedItems={selectedItems}
        onItemSelectionChange={handleItemSelection}
        onSelectAllChange={handleSelectAll}
      />
    </div>
  );
}
