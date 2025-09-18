import { Suspense } from "react";
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
import { Search, Plus, Users, TrendingUp, TrendingDown } from "lucide-react";
import { ClientsTable } from "@/components/clients/clients-table";
import { ClientsLoading } from "@/components/clients/clients-loading";
import { NewClientModal } from "@/components/clients/new-client-modal";
import { customerService } from "@/services/customer.service";
import { userService } from "@/services/user.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function ClientsData() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      throw new Error("No user session found");
    }

    const distributorId = await userService.getDistributorIdForUser(
      session.user.id,
    );

    if (!distributorId) {
      throw new Error("No distributor found for user");
    }

    const userInfo = await userService.getUserTenantInfo(session.user.id);
    const isSuperadmin = userInfo?.role === "SUPER_ADMIN";

    // Fetch real data from the database
    const dbClients = await customerService.listForDistributor(distributorId);

    // Transform database data to match the component interface
    const clients = dbClients.map((client, index) => {
      // Generate mock business data since it's not in the current schema
      const businessTypes = [
        "Supermercado",
        "Mercado Chino",
        "Almacén",
        "Minimarket",
        "Kiosco",
      ];
      const trends: ("up" | "down")[] = [
        "up",
        "up",
        "down",
        "up",
        "up",
        "down",
      ];

      return {
        id: client.id,
        name: client.name,
        address: client.address || `${client.city || "CABA"}`,
        type: businessTypes[index % businessTypes.length],
        lastPurchase: new Date(2024, 0, 15 - index).toISOString().split("T")[0], // Mock dates
        totalAmount: Math.floor(Math.random() * 25000) + 5000, // Mock amounts
        trend: trends[index % trends.length],
        phone: client.phone || `+54 11 4567-890${index + 1}`,
        email: `contacto@${client.name.toLowerCase().replace(/\s+/g, "")}.com`,
      };
    });

    return <ClientsTable clients={clients} />;
  } catch (error) {
    console.error("Error fetching clients:", error);

    // If no distributor found, show empty state
    if (
      error instanceof Error &&
      error.message.includes("No distributor found")
    ) {
      return (
        <div className="text-center py-8">
          <p className="text-muted-foreground">
            No se encontró un distribuidor asociado a tu cuenta.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Contacta al administrador para configurar tu acceso.
          </p>
        </div>
      );
    }

    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Error cargando los clientes.</p>
      </div>
    );
  }
}

export default async function ClientesPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Clientes</BreadcrumbPage>
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
              <h1 className="text-2xl font-semibold">Gestión de Clientes</h1>
              <p className="text-muted-foreground">
                Administra tu cartera de clientes y sus datos
              </p>
            </div>
            <div className="flex gap-2">
              <NewClientModal />
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Clientes
                </CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">127</div>
                <p className="text-xs text-muted-foreground">
                  +3 nuevos este mes
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Clientes Activos
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">89</div>
                <p className="text-xs text-muted-foreground">70% del total</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Ticket Promedio
                </CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">$1,650</div>
                <p className="text-xs text-muted-foreground">
                  +8% vs mes anterior
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Clientes en Riesgo
                </CardTitle>
                <TrendingDown className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">
                  Sin compras +30 días
                </p>
              </CardContent>
            </Card>
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
                    placeholder="Buscar por nombre, email o teléfono..."
                    className="pl-10"
                  />
                </div>
                <Select defaultValue="all">
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Todos los tipos" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos los tipos</SelectItem>
                    <SelectItem value="supermercado">Supermercado</SelectItem>
                    <SelectItem value="mercado_chino">Mercado Chino</SelectItem>
                    <SelectItem value="almacen">Almacén</SelectItem>
                    <SelectItem value="minimarket">Minimarket</SelectItem>
                    <SelectItem value="kiosco">Kiosco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Clients List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lista de Clientes
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Gestiona tu cartera de clientes
              </p>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<ClientsLoading />}>
                <ClientsData />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
