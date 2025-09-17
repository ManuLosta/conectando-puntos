"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Copy } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OrderDetailModal } from "./order-detail-modal";

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

export function OrdersTable({ orders }: OrdersTableProps) {
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewOrder = (order: Order) => {
    const orderDetail = generateOrderDetail(order);
    setSelectedOrder(orderDetail);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedOrder(null);
  };

  return (
    <>
      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
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
              <TableRow key={order.id} className="hover:bg-muted/50">
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
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleViewOrder(order)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <Copy className="h-4 w-4" />
                    </Button>
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
    </>
  );
}
