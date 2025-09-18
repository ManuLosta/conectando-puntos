"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Eye, Phone, Mail, TrendingUp, TrendingDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClientDetailModal } from "./client-detail-modal";

interface Client {
  id: string;
  name: string;
  address: string;
  lastPurchase: string;
  totalAmount: number;
  trend: "up" | "down";
  phone: string;
  email: string;
  clientType?: string;
  orderStats?: {
    totalOrders: number;
    totalAmount: number;
    monthlyAmount: number;
    lastOrderDate: Date | null;
    recentOrders: Array<{
      id: string;
      orderNumber: string;
      status: string;
      total: number;
      createdAt: Date;
    }>;
  };
}

interface ClientsTableProps {
  clients: Client[];
}

interface ClientDetail {
  id: string;
  name: string;
  address: string;
  type: string;
  lastPurchase: string;
  totalAmount: number;
  trend: "up" | "down";
  phone: string;
  email: string;
  clientType?: string;
  registrationDate: string;
  totalOrders: number;
  averageTicket: number;
  paymentTerms: string;
  creditLimit: number;
  status: "active" | "inactive" | "at_risk";
  notes?: string;
  recentOrders: Array<{
    id: string;
    date: string;
    amount: number;
    status: string;
  }>;
}

// Convert Client to ClientDetail with real data
function convertToClientDetail(client: Client): ClientDetail {
  const orderStats = client.orderStats;

  // Calculate average ticket from real data
  const averageTicket =
    orderStats && orderStats.totalOrders > 0
      ? orderStats.totalAmount / orderStats.totalOrders
      : 0;

  // Convert recent orders to the format expected by the modal
  const recentOrders =
    orderStats?.recentOrders?.map((order) => ({
      id: order.orderNumber, // Use order number instead of ID
      date: order.createdAt.toISOString().split("T")[0],
      amount: order.total,
      status: order.status,
    })) || [];

  return {
    ...client,
    type: client.clientType || "Sin tipo",
    registrationDate: "", // Not available in current schema
    totalOrders: orderStats?.totalOrders || 0,
    averageTicket: averageTicket,
    paymentTerms: "", // Not available in current schema
    creditLimit: 0, // Not available in current schema
    status: client.trend === "up" ? "active" : "at_risk",
    notes: "", // Not available in current schema
    recentOrders: recentOrders,
  };
}

function getTrendIcon(trend: "up" | "down") {
  if (trend === "up") {
    return <TrendingUp className="h-4 w-4 text-green-600" />;
  }
  return <TrendingDown className="h-4 w-4 text-red-600" />;
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(amount);
}

function formatDate(dateString: string) {
  if (!dateString) return "—";
  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function ClientsTable({ clients }: ClientsTableProps) {
  const [selectedClient, setSelectedClient] = useState<ClientDetail | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewClient = (client: Client) => {
    const clientDetail = convertToClientDetail(client);
    setSelectedClient(clientDetail);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  return (
    <>
      <div className="w-full">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="font-semibold">Cliente</TableHead>
              <TableHead className="font-semibold">Tipo</TableHead>
              <TableHead className="font-semibold">Última Compra</TableHead>
              <TableHead className="font-semibold text-right">
                Total Mes
              </TableHead>
              <TableHead className="font-semibold text-center">
                Tendencia
              </TableHead>
              <TableHead className="font-semibold text-center">
                Contacto
              </TableHead>
              <TableHead className="font-semibold text-center">
                Acciones
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map((client) => (
              <TableRow key={client.id} className="hover:bg-muted/50">
                <TableCell>
                  <div>
                    <div className="font-medium">{client.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {client.address}
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {client.clientType || "Sin tipo"}
                  </div>
                </TableCell>
                <TableCell>{formatDate(client.lastPurchase)}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(client.totalAmount)}
                </TableCell>
                <TableCell className="text-center">
                  {getTrendIcon(client.trend)}
                </TableCell>
                <TableCell className="text-center">
                  <div className="flex gap-1 justify-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        window.open(`tel:${client.phone}`, "_self")
                      }
                    >
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        window.open(`mailto:${client.email}`, "_self")
                      }
                    >
                      <Mail className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleViewClient(client)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ClientDetailModal
        client={selectedClient}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
