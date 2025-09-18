import React, { Suspense } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Package } from "lucide-react";
import { OrdersTable } from "@/components/orders/orders-table";
import { OrdersLoading } from "@/components/orders/orders-loading";

async function OrdersData() {
  // Mock data con todos los estados del enum OrderStatus
  const orders = [
    {
      id: "#1245",
      client: "Supermercado La Abundancia",
      salesperson: "Juan Pérez",
      date: "2024-01-15",
      status: "PENDING" as const,
      amount: 1250.0,
    },
    {
      id: "#1246",
      client: "Almacén Don Pepe",
      salesperson: "Ana Gómez",
      date: "2024-01-15",
      status: "PENDING" as const,
      amount: 340.5,
    },
    {
      id: "#1249",
      client: "Mercado Central",
      salesperson: "Carlos López",
      date: "2024-01-15",
      status: "CONFIRMED" as const,
      amount: 2100.0,
    },
    {
      id: "#1242",
      client: "Mercado Chino El Dragón",
      salesperson: "Ana Gómez",
      date: "2024-01-14",
      status: "CONFIRMED" as const,
      amount: 5800.0,
    },
    {
      id: "#1248",
      client: "Supermercado Norte",
      salesperson: "Juan Pérez",
      date: "2024-01-14",
      status: "IN_PREPARATION" as const,
      amount: 3200.0,
    },
    {
      id: "#1247",
      client: "Minimarket El Barrio",
      salesperson: "María Silva",
      date: "2024-01-14",
      status: "IN_PREPARATION" as const,
      amount: 1890.25,
    },
    {
      id: "#1240",
      client: "Supermercado Vea Centro",
      salesperson: "María Silva",
      date: "2024-01-13",
      status: "DELIVERED" as const,
      amount: 8150.75,
    },
    {
      id: "#1241",
      client: "Almacén La Esquina",
      salesperson: "Carlos López",
      date: "2024-01-13",
      status: "DELIVERED" as const,
      amount: 950.0,
    },
    {
      id: "#1243",
      client: "Kiosco San Martín",
      salesperson: "Juan Pérez",
      date: "2024-01-12",
      status: "CANCELLED" as const,
      amount: 750.0,
    },
  ];

  return <OrdersTable orders={orders} />;
}

export default function PedidosPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Pedidos</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-col gap-4">
          {/* Header with title and actions */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Gestión de Pedidos</h1>
              <p className="text-muted-foreground">
                Administra y realiza seguimiento de todos los pedidos de tus
                clientes
              </p>
            </div>
            <div className="flex gap-2">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Pedido
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Filtros y Búsqueda</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por cliente, número de pedido..."
                    className="pl-10"
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos los estados" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los estados</SelectItem>
                    <SelectItem value="pending">
                      Pendiente a confirmar
                    </SelectItem>
                    <SelectItem value="confirmed">Confirmado</SelectItem>
                    <SelectItem value="in_preparation">
                      En preparación
                    </SelectItem>
                    <SelectItem value="delivered">Enviado</SelectItem>
                    <SelectItem value="cancelled">Cancelado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Orders List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Lista de Pedidos
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Gestiona todos los pedidos de tus clientes
              </p>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<OrdersLoading />}>
                <OrdersData />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
