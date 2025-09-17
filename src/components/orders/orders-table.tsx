"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Copy, Check, Truck, X, CheckSquare, Square } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderDetailModal } from "./order-detail-modal";
import { ConfirmationModal } from "./confirmation-modal";

interface Order {
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
}

interface OrdersTableProps {
  orders: Order[];
  showBulkActions?: boolean;
  selectedOrders?: string[];
  onOrderSelectionChange?: (orderId: string, isSelected: boolean) => void;
  onSelectAllChange?: (isSelected: boolean) => void;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  client: string;
  salesperson: string;
  date: string;
  status:
    | "PENDING"
    | "CONFIRMED"
    | "IN_PREPARATION"
    | "DELIVERED"
    | "CANCELLED";
  paymentStatus: "PENDING" | "PAID" | "PARTIAL" | "REJECTED";
  amount: number;
  deliveryAddress?: string;
  notes?: string;
  items: Array<{
    id: string;
    product: {
      name: string;
      sku: string;
      brand?: string;
    };
    quantity: number;
    price: number;
    subtotal: number;
  }>;
}

// Función para generar datos mockeados completos del pedido
function generateOrderDetail(order: Order): OrderDetail {
  const mockItems = [
    {
      id: "1",
      product: {
        name: "Leche Entera La Serenísima",
        sku: "LSE-001",
        brand: "La Serenísima",
      },
      quantity: 24,
      price: 450.0,
      subtotal: 10800.0,
    },
    {
      id: "2",
      product: {
        name: "Pan Lactal Bimbo",
        sku: "BIM-002",
        brand: "Bimbo",
      },
      quantity: 12,
      price: 380.0,
      subtotal: 4560.0,
    },
    {
      id: "3",
      product: {
        name: "Queso Cremoso Sancor",
        sku: "SAN-003",
        brand: "Sancor",
      },
      quantity: 6,
      price: 890.0,
      subtotal: 5340.0,
    },
    {
      id: "4",
      product: {
        name: "Jamón Cocido Paladini",
        sku: "PAL-004",
        brand: "Paladini",
      },
      quantity: 3,
      price: 1200.0,
      subtotal: 3600.0,
    },
    {
      id: "5",
      product: {
        name: "Aceite Girasol Natura",
        sku: "NAT-005",
        brand: "Natura",
      },
      quantity: 8,
      price: 520.0,
      subtotal: 4160.0,
    },
  ];

  // Calcular total basado en los items o usar el amount del pedido
  const calculatedTotal = mockItems.reduce(
    (sum, item) => sum + item.subtotal,
    0,
  );
  const finalTotal =
    order.amount > calculatedTotal ? order.amount : calculatedTotal;

  return {
    id: order.id,
    orderNumber: order.id,
    client: order.client,
    salesperson: order.salesperson,
    date: order.date,
    status: order.status,
    paymentStatus: "PENDING" as const,
    amount: finalTotal,
    deliveryAddress: `${order.client} - Av. Corrientes 1234, CABA, Buenos Aires`,
    notes:
      "Cliente preferencial. Entregar antes de las 10:00 AM. Verificar estado de productos perecederos.",
    items: mockItems,
  };
}

function getStatusBadge(status: Order["status"]) {
  switch (status) {
    case "PENDING":
      return (
        <Badge
          variant="secondary"
          className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
        >
          Pendiente a confirmar
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge
          variant="secondary"
          className="bg-blue-100 text-blue-800 hover:bg-blue-100"
        >
          Confirmado
        </Badge>
      );
    case "IN_PREPARATION":
      return (
        <Badge
          variant="secondary"
          className="bg-purple-100 text-purple-800 hover:bg-purple-100"
        >
          En preparación
        </Badge>
      );
    case "DELIVERED":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 hover:bg-green-100"
        >
          Enviado
        </Badge>
      );
    case "CANCELLED":
      return <Badge variant="destructive">Cancelado</Badge>;
    default:
      return <Badge variant="secondary">Desconocido</Badge>;
  }
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

export function OrdersTable({
  orders,
  showBulkActions = false,
  selectedOrders = [],
  onOrderSelectionChange,
  onSelectAllChange,
}: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmationModal, setConfirmationModal] = useState<{
    isOpen: boolean;
    type: "confirm" | "ship" | "cancel";
    order: Order | null;
  }>({ isOpen: false, type: "confirm", order: null });

  const handleViewOrder = (order: Order) => {
    const orderDetail = generateOrderDetail(order);
    setSelectedOrder(orderDetail);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  const handleConfirmOrder = (order: Order) => {
    setConfirmationModal({
      isOpen: true,
      type: "confirm",
      order,
    });
  };

  const handleShipOrder = (order: Order) => {
    setConfirmationModal({
      isOpen: true,
      type: "ship",
      order,
    });
  };

  const handleCancelOrder = (order: Order) => {
    setConfirmationModal({
      isOpen: true,
      type: "cancel",
      order,
    });
  };

  const handleConfirmAction = () => {
    // Aquí iría la lógica para actualizar el estado del pedido
    console.log(
      `Acción ${confirmationModal.type} confirmada para pedido ${confirmationModal.order?.id}`,
    );
    setConfirmationModal({ isOpen: false, type: "confirm", order: null });
    // TODO: Actualizar el estado del pedido en la base de datos
  };

  const handleCloseConfirmation = () => {
    setConfirmationModal({ isOpen: false, type: "confirm", order: null });
  };

  const getAvailableActions = (order: Order) => {
    const actions = [
      // Ver pedido - siempre disponible
      <Button
        key="view"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={() => handleViewOrder(order)}
        title="Ver pedido"
      >
        <Eye className="h-4 w-4" />
      </Button>,
      // Copiar - siempre disponible
      <Button
        key="copy"
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        title="Copiar pedido"
      >
        <Copy className="h-4 w-4" />
      </Button>,
    ];

    // Confirmar pedido - solo para pedidos PENDING
    if (order.status === "PENDING") {
      actions.push(
        <Button
          key="confirm"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-green-600 hover:text-green-700 hover:bg-green-50"
          onClick={() => handleConfirmOrder(order)}
          title="Confirmar pedido"
        >
          <Check className="h-4 w-4" />
        </Button>,
      );
    }

    // Enviar pedido - solo para pedidos CONFIRMED o IN_PREPARATION
    if (order.status === "CONFIRMED" || order.status === "IN_PREPARATION") {
      actions.push(
        <Button
          key="ship"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          onClick={() => handleShipOrder(order)}
          title="Enviar pedido"
        >
          <Truck className="h-4 w-4" />
        </Button>,
      );
    }

    // Cancelar pedido - solo para pedidos que no estén DELIVERED o CANCELLED
    if (order.status !== "DELIVERED" && order.status !== "CANCELLED") {
      actions.push(
        <Button
          key="cancel"
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
          onClick={() => handleCancelOrder(order)}
          title="Cancelar pedido"
        >
          <X className="h-4 w-4" />
        </Button>,
      );
    }

    return actions;
  };

  const toggleOrderSelection = (orderId: string) => {
    if (onOrderSelectionChange) {
      onOrderSelectionChange(orderId, !selectedOrders.includes(orderId));
    }
  };

  const toggleSelectAll = () => {
    if (onSelectAllChange) {
      onSelectAllChange(selectedOrders.length !== orders.length);
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
                    {selectedOrders.length === orders.length &&
                    orders.length > 0 ? (
                      <CheckSquare className="h-4 w-4" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </Button>
                </TableHead>
              )}
              <TableHead className="font-semibold">Pedido</TableHead>
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold">Vendedor</TableHead>
              <TableHead className="font-semibold">Fecha</TableHead>
              <TableHead className="font-semibold">Estado</TableHead>
              <TableHead className="font-semibold text-right">Monto</TableHead>
              <TableHead className="font-semibold text-center">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow
                key={order.id}
                className={`hover:bg-muted/50 ${selectedOrders.includes(order.id) ? "bg-blue-50" : ""}`}
              >
                {showBulkActions && (
                  <TableCell className="w-12">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleOrderSelection(order.id)}
                      className="h-8 w-8 p-0"
                    >
                      {selectedOrders.includes(order.id) ? (
                        <CheckSquare className="h-4 w-4 text-blue-600" />
                      ) : (
                        <Square className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                )}
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.client}</TableCell>
                <TableCell>{order.salesperson}</TableCell>
                <TableCell>{formatDate(order.date)}</TableCell>
                <TableCell>{getStatusBadge(order.status)}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(order.amount)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex gap-1 justify-center">
                    {getAvailableActions(order)}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <OrderDetailModal
        order={selectedOrder}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <ConfirmationModal
        isOpen={confirmationModal.isOpen}
        onClose={handleCloseConfirmation}
        onConfirm={handleConfirmAction}
        type={confirmationModal.type}
        order={confirmationModal.order}
      />
    </>
  );
}
