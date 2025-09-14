import { prisma } from "@/lib/prisma";

export interface DashboardMetrics {
  dailySales: {
    amount: number;
    change: number;
    changeType: "increase" | "decrease";
  };
  pendingOrders: {
    count: number;
    change: number;
    changeType: "increase" | "decrease";
  };
  purchaseOrders: {
    count: number;
    change: number;
    changeType: "increase" | "decrease";
  };
  pendingInvoices: {
    amount: number;
    change: number;
    changeType: "increase" | "decrease";
  };
}

export interface RecentActivity {
  id: string;
  type: "Venta" | "Compra" | "Pago" | "Recepcion";
  description: string;
  time: string;
  amount?: number;
}

interface OrderWithRelations {
  id: string;
  orderNumber: string;
  status: string;
  total: number | string | object;
  createdAt: Date;
  client?: {
    user: {
      name: string;
    };
  } | null;
  salesperson?: {
    user: {
      name: string;
    };
  } | null;
}

export interface QuickAction {
  id: string;
  title: string;
  href: string;
  variant?: "default" | "secondary";
}

export class DashboardService {
  constructor() {}

  async getDailySales() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    // Start and end of today
    const startOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );
    const endOfToday = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59,
    );

    // Start and end of yesterday
    const startOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
    );
    const endOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      23,
      59,
      59,
    );

    // Daily Sales
    const todaySales = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startOfToday,
          lte: endOfToday,
        },
        status: {
          not: "CANCELLED",
        },
      },
      _sum: {
        total: true,
      },
    });

    const yesterdaySales = await prisma.order.aggregate({
      where: {
        createdAt: {
          gte: startOfYesterday,
          lte: endOfYesterday,
        },
        status: {
          not: "CANCELLED",
        },
      },
      _sum: {
        total: true,
      },
    });

    const dailySalesAmount = Number(todaySales._sum.total || 0);
    const yesterdaySalesAmount = Number(yesterdaySales._sum.total || 0);
    const salesChange =
      yesterdaySalesAmount > 0
        ? ((dailySalesAmount - yesterdaySalesAmount) / yesterdaySalesAmount) *
          100
        : 0;

    return {
      amount: dailySalesAmount,
      change: Math.abs(salesChange),
      changeType:
        salesChange >= 0 ? ("increase" as const) : ("decrease" as const),
    };
  }

  async getPendingOrders() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const endOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      23,
      59,
      59,
    );

    // Pending Orders
    const pendingOrdersToday = await prisma.order.count({
      where: {
        status: "PENDING",
      },
    });

    const pendingOrdersYesterday = await prisma.order.count({
      where: {
        status: "PENDING",
        updatedAt: {
          lte: endOfYesterday,
        },
      },
    });

    const pendingOrdersChange = pendingOrdersToday - pendingOrdersYesterday;

    return {
      count: pendingOrdersToday,
      change: Math.abs(pendingOrdersChange),
      changeType:
        pendingOrdersChange >= 0
          ? ("increase" as const)
          : ("decrease" as const),
    };
  }

  async getPurchaseOrders() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const endOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      23,
      59,
      59,
    );

    // Purchase Orders (using orders with status IN_PREPARATION as proxy)
    const purchaseOrdersToday = await prisma.order.count({
      where: {
        status: "IN_PREPARATION",
      },
    });

    const purchaseOrdersYesterday = await prisma.order.count({
      where: {
        status: "IN_PREPARATION",
        updatedAt: {
          lte: endOfYesterday,
        },
      },
    });

    const purchaseOrdersChange = purchaseOrdersToday - purchaseOrdersYesterday;

    return {
      count: purchaseOrdersToday,
      change: Math.abs(purchaseOrdersChange),
      changeType:
        purchaseOrdersChange >= 0
          ? ("increase" as const)
          : ("decrease" as const),
    };
  }

  async getPendingInvoices() {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const endOfYesterday = new Date(
      yesterday.getFullYear(),
      yesterday.getMonth(),
      yesterday.getDate(),
      23,
      59,
      59,
    );

    // Pending Invoices (orders with pending payment)
    const pendingInvoicesToday = await prisma.order.aggregate({
      where: {
        paymentStatus: "PENDING",
      },
      _sum: {
        total: true,
      },
    });

    const pendingInvoicesYesterday = await prisma.order.aggregate({
      where: {
        paymentStatus: "PENDING",
        updatedAt: {
          lte: endOfYesterday,
        },
      },
      _sum: {
        total: true,
      },
    });

    const pendingInvoicesAmount = Number(pendingInvoicesToday._sum.total || 0);
    const yesterdayPendingInvoicesAmount = Number(
      pendingInvoicesYesterday._sum.total || 0,
    );
    const invoicesChange =
      yesterdayPendingInvoicesAmount > 0
        ? ((pendingInvoicesAmount - yesterdayPendingInvoicesAmount) /
            yesterdayPendingInvoicesAmount) *
          100
        : 0;

    return {
      amount: pendingInvoicesAmount,
      change: Math.abs(invoicesChange),
      changeType:
        invoicesChange >= 0 ? ("increase" as const) : ("decrease" as const),
    };
  }

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    const [dailySales, pendingOrders, purchaseOrders, pendingInvoices] =
      await Promise.all([
        this.getDailySales(),
        this.getPendingOrders(),
        this.getPurchaseOrders(),
        this.getPendingInvoices(),
      ]);

    return {
      dailySales,
      pendingOrders,
      purchaseOrders,
      pendingInvoices,
    };
  }

  async getRecentActivity(): Promise<RecentActivity[]> {
    const recentOrders = await prisma.order.findMany({
      take: 4,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        client: {
          include: {
            user: true,
          },
        },
        salesperson: {
          include: {
            user: true,
          },
        },
      },
    });

    return recentOrders.map((order: OrderWithRelations) => {
      const time = new Date(order.createdAt).toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });

      let type: RecentActivity["type"] = "Venta";
      let description = "";
      let amount: number | undefined;

      switch (order.status) {
        case "PENDING":
          type = "Venta";
          description = `Pedido ${order.orderNumber} - ${order.client?.user.name || "Cliente"}`;
          amount = Number(order.total);
          break;
        case "IN_PREPARATION":
          type = "Compra";
          description = `Preparación ${order.orderNumber} - ${order.salesperson?.user.name || "Vendedor"}`;
          break;
        case "DELIVERED":
          type = "Pago";
          description = `Entrega ${order.orderNumber} - ${order.client?.user.name || "Cliente"}`;
          amount = Number(order.total);
          break;
        default:
          type = "Recepcion";
          description = `Procesando ${order.orderNumber}`;
      }

      return {
        id: order.id,
        type,
        description,
        time,
        amount,
      };
    });
  }

  getQuickActions(): QuickAction[] {
    return [
      {
        id: "new-sale",
        title: "Nueva Venta",
        href: "/orders/new",
        variant: "default",
      },
      {
        id: "new-purchase",
        title: "Nueva Compra",
        href: "/purchases/new",
        variant: "secondary",
      },
      {
        id: "new-client",
        title: "Nuevo Cliente",
        href: "/clients/new",
        variant: "secondary",
      },
      {
        id: "register-payment",
        title: "Registrar Pago",
        href: "/payments/new",
        variant: "secondary",
      },
    ];
  }
}

export const dashboardService = new DashboardService();
