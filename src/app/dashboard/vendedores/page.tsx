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
import { UserCheck } from "lucide-react";
import { VendorsTable } from "@/components/vendors/vendors-table";
import { VendorsLoading } from "@/components/vendors/vendors-loading";
import { VendorsPageClient } from "@/components/vendors/vendors-page-client";
import { salespersonService } from "@/services/salesperson.service";
import { userService } from "@/services/user.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

export const dynamic = "force-dynamic";

async function VendorsData() {
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

    const dbSalespeople = await salespersonService.listForDistributor(
      distributorId,
      {
        userId: session.user.id,
        bypassRls: Boolean(isSuperadmin),
      },
    );

    // Transform database data to match the component interface
    const vendors = dbSalespeople.map((salesperson) => ({
      id: salesperson.id,
      name: salesperson.name,
      email: salesperson.email,
      phone: salesperson.phone || `+54 11 5555-0000`,
      lastSale: new Date().toISOString().split("T")[0],
      totalSold: 0,
      status: "active" as const,
      clientsCount: 0,
    }));

    return <VendorsTable vendors={vendors} />;
  } catch (error) {
    console.error("Error fetching vendors:", error);

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
  }
}

export default async function VendedoresPage() {
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
        <VendorsPageClient>
          <div className="flex flex-col gap-4">
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
        </VendorsPageClient>
      </div>
    </>
  );
}
