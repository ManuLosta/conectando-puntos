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
import { Package, Clock, Truck } from "lucide-react";
import { OrdersLoading } from "@/components/orders/orders-loading";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { orderService } from "@/services/order.service";
import { OrderWithItems } from "@/repositories/order.repository";
import { OrdersClient } from "@/components/orders/orders-client";
import { userService } from "@/services/user.service";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";

interface ProcessedOrder {
  id: string;
  orderNumber: string; // Agregar orderNumber para mostrar en la UI
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

// Función para transformar los datos del service al formato esperado por los componentes
function transformOrderData(orders: OrderWithItems[]): ProcessedOrder[] {
  return orders.map((order) => ({
    id: order.id, // Usar el ID real de la base de datos
    orderNumber: order.orderNumber, // Incluir el número de pedido para mostrar
    client: order.client?.name || "Cliente no especificado",
    salesperson: order.salesperson?.phone || "Vendedor no especificado",
    date: order.createdAt.toISOString(),
    status: order.status as ProcessedOrder["status"],
    amount: order.total,
  }));
}

async function getOrdersData() {
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

    // Obtener todos los pedidos de la distribuidora
    const allOrders =
      await orderService.getAllOrdersByDistributor(distributorId);

    // Obtener pedidos por estado específico
    const pendingOrders = await orderService.getOrdersByDistributorAndStatus(
      distributorId,
      "PENDING",
    );
    const confirmedOrders = await orderService.getOrdersByDistributorAndStatus(
      distributorId,
      "CONFIRMED",
    );
    const inPreparationOrders =
      await orderService.getOrdersByDistributorAndStatus(
        distributorId,
        "IN_PREPARATION",
      );

    // Combinar pedidos confirmados y en preparación para "por enviar"
    const ordersToShip = [...confirmedOrders, ...inPreparationOrders];

    return {
      allOrders: transformOrderData(allOrders),
      pendingOrders: transformOrderData(pendingOrders),
      ordersToShip: transformOrderData(ordersToShip),
    };
  } catch (error) {
    console.error("Error fetching orders:", error);
    return {
      allOrders: [],
      pendingOrders: [],
      ordersToShip: [],
    };
  }
}

function OrdersSection({
  orders,
  title,
  icon: Icon,
  description,
  emptyMessage,
  showBulkActions = false,
}: {
  orders: ProcessedOrder[];
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  emptyMessage: string;
  showBulkActions?: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon className="h-5 w-5" />
            {title}
            <Badge variant="secondary" className="ml-2">
              {orders.length}
            </Badge>
          </div>
        </CardTitle>
        <p className="text-sm text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent>
        {orders.length > 0 ? (
          <Suspense fallback={<OrdersLoading />}>
            <OrdersClient orders={orders} showBulkActions={showBulkActions} />
          </Suspense>
        ) : (
          <div className="text-center py-8">
            <Icon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">{emptyMessage}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default async function PedidosPage() {
  const { allOrders, pendingOrders, ordersToShip } = await getOrdersData();

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

      <div className="flex flex-1  mt-2 flex-col gap-4 p-4 pt-0">
        <div className="flex flex-col gap-4">
          {/* Tabs para las 3 zonas */}
          <Tabs defaultValue="all" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="all" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Todos los pedidos
                <Badge variant="secondary" className="ml-1">
                  {allOrders.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="pending" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Por confirmar
                <Badge variant="secondary" className="ml-1">
                  {pendingOrders.length}
                </Badge>
              </TabsTrigger>
              <TabsTrigger value="to-ship" className="flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Por enviar
                <Badge variant="secondary" className="ml-1">
                  {ordersToShip.length}
                </Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="space-y-4">
              <OrdersSection
                orders={allOrders}
                title="Todos los Pedidos"
                icon={Package}
                description="Vista completa de todos los pedidos del sistema"
                emptyMessage="No hay pedidos registrados"
              />
            </TabsContent>

            <TabsContent value="pending" className="space-y-4">
              <OrdersSection
                orders={pendingOrders}
                title="Pedidos por Confirmar"
                icon={Clock}
                description="Pedidos pendientes que necesitan confirmación"
                emptyMessage="No hay pedidos pendientes de confirmar"
                showBulkActions={true}
              />
            </TabsContent>

            <TabsContent value="to-ship" className="space-y-4">
              <OrdersSection
                orders={ordersToShip}
                title="Pedidos por Enviar"
                icon={Truck}
                description="Pedidos confirmados y en preparación listos para envío"
                emptyMessage="No hay pedidos listos para enviar"
                showBulkActions={true}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
