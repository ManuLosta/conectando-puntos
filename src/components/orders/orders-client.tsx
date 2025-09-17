"use client";

import { useState } from "react";
import { OrdersTable } from "./orders-table";
import { NewOrderModal } from "./new-order-modal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface OrdersClientProps {
  orders: Array<{
    id: string;
    client: string;
    salesperson: string;
    date: string;
    status:
      | "PENDING"
      | "CONFIRMED"
      | "IN_PREPARATION"
      | "DELIVERED"
      | "CANCELLED";
    amount: number;
  }>;
  showBulkActions?: boolean;
}

interface CreateOrderData {
  clientId: string;
  salespersonId: string;
  items: Array<{
    sku: string;
    quantity: number;
  }>;
  deliveryAddress?: string;
  notes?: string;
}

export function OrdersClient({
  orders,
  showBulkActions = false,
}: OrdersClientProps) {
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);

  const handleCreateOrder = (orderData: CreateOrderData) => {
    // Aquí irá la lógica para crear el pedido
    console.log("Creating order:", orderData);
    // TODO: Implementar llamada al API
  };

  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  const handleOrderSelection = (orderId: string, isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders([...selectedOrders, orderId]);
    } else {
      setSelectedOrders(selectedOrders.filter((id) => id !== orderId));
    }
  };

  const handleSelectAll = (isSelected: boolean) => {
    if (isSelected) {
      setSelectedOrders(orders.map((order) => order.id));
    } else {
      setSelectedOrders([]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header con botón de nuevo pedido */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">
            {orders.length} {orders.length === 1 ? "pedido" : "pedidos"}
          </h3>
        </div>
        <Button
          onClick={() => setIsNewOrderModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Pedido
        </Button>
      </div>

      {/* Tabla de pedidos */}
      <OrdersTable
        orders={orders}
        showBulkActions={showBulkActions}
        selectedOrders={selectedOrders}
        onOrderSelectionChange={handleOrderSelection}
        onSelectAllChange={handleSelectAll}
      />

      {/* Modal para nuevo pedido */}
      <NewOrderModal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        onSave={handleCreateOrder}
      />
    </div>
  );
}
