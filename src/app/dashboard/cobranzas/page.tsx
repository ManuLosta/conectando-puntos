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
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Clock,
  CheckCircle,
  DollarSign,
  Plus,
  Search,
} from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { collectionsService } from "@/services/cobranzas.service";
import type {
  CollectionsMetrics,
  InvoiceCollection,
} from "@/services/cobranzas.service";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { userService } from "@/services/user.service";
import { RegisterPaymentModal } from "@/components/cobranzas/register-payment-modal";

export const dynamic = "force-dynamic";

function getEstadoBadge(estado: "Vencida" | "Por Vencer" | "Vigente") {
  switch (estado) {
    case "Vencida":
      return (
        <Badge
          variant="destructive"
          className="bg-red-100 text-red-800 border-red-200"
        >
          Vencida
        </Badge>
      );
    case "Por Vencer":
      return (
        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
          Hoy
        </Badge>
      );
    case "Vigente":
      return (
        <Badge className="bg-green-100 text-green-800 border-green-200">
          Vigente
        </Badge>
      );
    default:
      return <Badge variant="outline">{estado}</Badge>;
  }
}

function getDiasColor(dias: number) {
  if (dias < 0) return "text-red-600 font-semibold";
  if (dias === 0) return "text-orange-600 font-semibold";
  return "text-green-600";
}

function CobranzasLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
      <div className="h-96 bg-muted animate-pulse rounded-lg" />
    </div>
  );
}

async function CobranzasMetricsSection() {
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

    const metrics =
      await collectionsService.getCollectionsMetrics(distributorId);
    return <CobranzasMetricsDisplay metrics={metrics} />;
  } catch (error) {
    console.error("Error fetching metrics:", error);
    return <CobranzasMetricsError />;
  }
}

function CobranzasMetricsError() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              Error cargando datos
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CobranzasMetricsLoading() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
      ))}
    </div>
  );
}

async function CobranzasData() {
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

    const facturas =
      await collectionsService.getInvoicesForCollection(distributorId);
    return <CobranzasTableDisplay facturas={facturas} />;
  } catch (error) {
    console.error("Error fetching cobranzas data:", error);

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
        <p className="text-muted-foreground">
          Error cargando las facturas de cobranza.
        </p>
      </div>
    );
  }
}

function CobranzasMetricsDisplay({ metrics }: { metrics: CollectionsMetrics }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Facturas Vencidas
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            {formatCurrency(metrics.facturasVencidas.amount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.facturasVencidas.items}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Por Vencer (7 días)
            </CardTitle>
            <Clock className="h-4 w-4 text-orange-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-orange-600">
            {formatCurrency(metrics.porVencer.amount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.porVencer.items}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Vigentes</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {formatCurrency(metrics.vigentes.amount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.vigentes.items}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">
              Total a Cobrar
            </CardTitle>
            <DollarSign className="h-4 w-4 text-blue-500" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatCurrency(metrics.totalACobrar.amount)}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.totalACobrar.items}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function CobranzasTableDisplay({
  facturas,
}: {
  facturas: InvoiceCollection[];
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Estado de Cobranzas</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Controla todas las facturas pendientes de cobro
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Factura</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="text-right">Monto</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {facturas.map((factura: InvoiceCollection) => (
              <TableRow key={factura.id}>
                <TableCell className="font-medium">
                  {factura.invoiceNumber}
                </TableCell>
                <TableCell>{factura.cliente}</TableCell>
                <TableCell>{factura.vencimiento}</TableCell>
                <TableCell className={getDiasColor(factura.dias)}>
                  {factura.dias > 0 ? `+${factura.dias}` : factura.dias}
                </TableCell>
                <TableCell>{getEstadoBadge(factura.estado)}</TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(factura.monto)}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">
                    <DollarSign className="h-4 w-4 mr-1" />
                    Contactar
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default async function CobranzasPage() {
  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Cobranzas</BreadcrumbPage>
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
              <h1 className="text-2xl font-semibold">Gestión de Cobranzas</h1>
              <p className="text-muted-foreground">
                Gestiona tus cobros y controla los vencimientos
              </p>
            </div>
            <div className="flex gap-2">
              <RegisterPaymentModal />
            </div>
          </div>

          {/* Metrics Cards */}
          <Suspense fallback={<CobranzasMetricsLoading />}>
            <CobranzasMetricsSection />
          </Suspense>

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
                    placeholder="Buscar por factura, cliente..."
                    className="pl-10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cobranzas Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Estado de Cobranzas
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Controla todas las facturas pendientes de cobro
              </p>
            </CardHeader>
            <CardContent>
              <Suspense fallback={<CobranzasLoading />}>
                <CobranzasData />
              </Suspense>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
