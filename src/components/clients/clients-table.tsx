"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
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
  type: string;
  lastPurchase: string;
  totalAmount: number;
  trend: "up" | "down";
  phone: string;
  email: string;
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

// Función para generar datos mockeados completos del cliente
function generateClientDetail(client: Client): ClientDetail {
  const mockRecentOrders = [
    {
      id: "#1245",
      date: "2024-01-15",
      amount: 1250.0,
      status: "DELIVERED",
    },
    {
      id: "#1242",
      date: "2024-01-10",
      amount: 2800.0,
      status: "CONFIRMED",
    },
    {
      id: "#1238",
      date: "2024-01-05",
      amount: 950.0,
      status: "DELIVERED",
    },
  ];

  return {
    ...client,
    registrationDate: "2023-08-15",
    totalOrders: 24,
    averageTicket: client.totalAmount / 24,
    paymentTerms: "30 días",
    creditLimit: 50000.0,
    status: client.trend === "up" ? "active" : "at_risk",
    notes: `Cliente ${client.type.toLowerCase()}. Preferencia por productos de marca. Historial de pagos: excelente.`,
    recentOrders: mockRecentOrders,
  };
}

function getTypeBadge(type: string) {
  const typeColors: Record<string, string> = {
    Supermercado: "bg-blue-100 text-blue-800 hover:bg-blue-100",
    "Mercado Chino": "bg-purple-100 text-purple-800 hover:bg-purple-100",
    Almacén: "bg-green-100 text-green-800 hover:bg-green-100",
    Minimarket: "bg-orange-100 text-orange-800 hover:bg-orange-100",
    Kiosco: "bg-gray-100 text-gray-800 hover:bg-gray-100",
  };

  return (
    <Badge
      variant="secondary"
      className={
        typeColors[type] || "bg-gray-100 text-gray-800 hover:bg-gray-100"
      }
    >
      {type}
    </Badge>
  );
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
  return new Date(dateString).toLocaleDateString("es-ES", {
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
    const clientDetail = generateClientDetail(client);
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
                <TableCell>{getTypeBadge(client.type)}</TableCell>
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
