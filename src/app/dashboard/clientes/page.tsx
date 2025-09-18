import { Suspense } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";
import { ClientsTable } from "@/components/clients/clients-table";
import { ClientsLoading } from "@/components/clients/clients-loading";
import { ClientsPageClient } from "@/components/clients/clients-page-client";
import { customerService } from "@/services/customer.service";
import { userService } from "@/services/user.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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

    // Fetch real data from the database with order statistics
    const dbClients =
      await customerService.listForDistributorWithStats(distributorId);

    // Transform database data to match the component interface
    const clients = dbClients.map((client) => ({
      id: client.id,
      name: client.name,
      address: client.address || client.city || "Sin dirección",
      lastPurchase: client.orderStats.lastOrderDate?.toISOString() || "",
      totalAmount: client.orderStats.monthlyAmount, // Monthly total
      trend:
        client.orderStats.totalAmount > 0 ? ("up" as const) : ("down" as const),
      phone: client.phone || "Sin teléfono",
      email:
        client.email ||
        `contacto@${client.name.toLowerCase().replace(/\s+/g, "")}.com`,
      clientType: client.clientType,
      orderStats: client.orderStats, // Pass the full order statistics
    }));

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

    // For other errors, show empty state
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">
          Error al cargar los clientes. Intenta nuevamente.
        </p>
      </div>
    );
  }
}

export default function ClientesPage() {
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
          <ClientsPageClient>
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
          </ClientsPageClient>
        </div>
      </div>
    </>
  );
}
