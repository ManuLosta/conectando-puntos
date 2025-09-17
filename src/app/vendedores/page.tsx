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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, UserCheck } from "lucide-react";
import { VendorsTable } from "@/components/vendors/vendors-table";
import { VendorsLoading } from "@/components/vendors/vendors-loading";
import { salespersonService } from "@/services/salesperson.service";

// Mock distributor ID - in a real app, this would come from the user session
const MOCK_DISTRIBUTOR_ID = "cmfndn9pf00003asbevn4stoy";

async function VendorsData() {
  try {
    // Fetch real data from the database
    const dbSalespeople =
      await salespersonService.listForDistributor(MOCK_DISTRIBUTOR_ID);

    // Transform database data to match the component interface
    const vendors = await Promise.all(
      dbSalespeople.map(async (salesperson) => {
        // Get sales statistics for each salesperson
        const stats = await salespersonService.getSalesStatsForDistributor(
          MOCK_DISTRIBUTOR_ID,
          salesperson.id,
        );

        return {
          id: salesperson.id,
          name: salesperson.name,
          email: salesperson.email,
          phone: salesperson.phone || `+54 11 5555-0000`,
          lastSale:
            stats.lastSaleDate || new Date().toISOString().split("T")[0],
          totalSold: stats.totalSold,
          status: salesperson.isActive
            ? ("active" as const)
            : ("inactive" as const),
          clientsCount: stats.clientsCount,
        };
      }),
    );

    return <VendorsTable vendors={vendors} />;
  } catch (error) {
    console.error("Error fetching vendors:", error);

    // Fallback to mock data if database fetch fails
    const fallbackVendors = [
      {
        id: "1",
        name: "Juan Pérez",
        email: "juan.perez@conectandopuntos.com",
        phone: "+54 11 5555-0001",
        lastSale: "2024-01-15",
        totalSold: 45750.0,
        status: "active" as const,
        clientsCount: 12,
      },
      {
        id: "2",
        name: "Ana Gómez",
        email: "ana.gomez@conectandopuntos.com",
        phone: "+54 11 5555-0002",
        lastSale: "2024-01-14",
        totalSold: 38900.0,
        status: "active" as const,
        clientsCount: 8,
      },
    ];

    return <VendorsTable vendors={fallbackVendors} />;
  }
}

export default function VendedoresPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Vendedores</BreadcrumbPage>
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
              <h1 className="text-2xl font-semibold">Gestión de Vendedores</h1>
              <p className="text-muted-foreground">
                Administra tu equipo de ventas y su rendimiento
              </p>
            </div>
            <div className="flex gap-2">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Nuevo Vendedor
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
                    placeholder="Buscar por nombre, email o teléfono..."
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vendors List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Lista de Vendedores
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Gestiona tu equipo de ventas
              </p>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<VendorsLoading />}>
                <VendorsData />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
