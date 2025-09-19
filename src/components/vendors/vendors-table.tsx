"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Phone, Mail, UserCheck } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { VendorDetailModal } from "./vendor-detail-modal";

interface Vendor {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastSale: string;
  totalSold: number;
  status: "active" | "inactive";
  clientsCount: number;
}

interface VendorsTableProps {
  vendors: Vendor[];
}

interface VendorDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  lastSale: string;
  totalSold: number;
  status: "active" | "inactive";
  clientsCount: number;
  hireDate: string;
  salesThisMonth: number;
  averageTicket: number;
  notes?: string;
  recentSales: Array<{
    id: string;
    client: string;
    date: string;
    amount: number;
  }>;
}

// Función para generar datos mockeados completos del vendedor
function generateVendorDetail(vendor: Vendor): VendorDetail {
  const mockRecentSales = [
    {
      id: "#1245",
      client: "Supermercado La Abundancia",
      date: "2024-01-15",
      amount: 1250.0,
    },
    {
      id: "#1242",
      client: "Mercado Chino El Dragón",
      date: "2024-01-14",
      amount: 2800.0,
    },
    {
      id: "#1238",
      client: "Almacén Don Pepe",
      date: "2024-01-13",
      amount: 950.0,
    },
  ];

  return {
    ...vendor,
    hireDate: "2023-03-15",
    salesThisMonth: vendor.totalSold * 0.3, // 30% of total as this month's sales
    averageTicket: vendor.totalSold / 25, // Assuming 25 sales on average
    notes: `Vendedor ${vendor.status === "active" ? "activo" : "inactivo"}. Especializado en ${vendor.clientsCount > 10 ? "grandes cuentas" : "pequeños comercios"}.`,
    recentSales: mockRecentSales,
  };
}

function getStatusBadge(status: "active" | "inactive") {
  switch (status) {
    case "active":
      return (
        <Badge
          variant="secondary"
          className="bg-green-100 text-green-800 hover:bg-green-100"
        >
          Activo
        </Badge>
      );
    case "inactive":
      return (
        <Badge
          variant="secondary"
          className="bg-gray-100 text-gray-800 hover:bg-gray-100"
        >
          Inactivo
        </Badge>
      );
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

export function VendorsTable({ vendors }: VendorsTableProps) {
  const [selectedVendor, setSelectedVendor] = useState<VendorDetail | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleViewVendor = (vendor: Vendor) => {
    const vendorDetail = generateVendorDetail(vendor);
    setSelectedVendor(vendorDetail);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedVendor(null);
  };

  return (
    <>
      <div className="w-full">
        {vendors.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-semibold">Nombre</TableHead>
                <TableHead className="font-semibold">Contacto</TableHead>
                <TableHead className="font-semibold">Última Venta</TableHead>
                <TableHead className="font-semibold text-right">
                  Total Vendido
                </TableHead>
                <TableHead className="font-semibold text-center">
                  Estado
                </TableHead>
                <TableHead className="font-semibold text-center">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vendors.map((vendor) => (
                <TableRow key={vendor.id} className="hover:bg-muted/50">
                  <TableCell>
                    <div>
                      <div className="font-medium">{vendor.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {vendor.clientsCount} cliente
                        {vendor.clientsCount !== 1 ? "s" : ""}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        {vendor.phone}
                      </div>
                      <div className="flex items-center gap-1 text-sm">
                        <Mail className="h-3 w-3 text-muted-foreground" />
                        {vendor.email}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{formatDate(vendor.lastSale)}</TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(vendor.totalSold)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStatusBadge(vendor.status)}
                  </TableCell>
                  <TableCell className="text-center">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleViewVendor(vendor)}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8">
            <UserCheck className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              No hay vendedores registrados
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Comienza agregando tu primer vendedor
            </p>
          </div>
        )}
      </div>

      <VendorDetailModal
        vendor={selectedVendor}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
