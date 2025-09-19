import { prisma } from "@/lib/prisma";

export interface CollectionsMetrics {
  facturasVencidas: {
    count: number;
    amount: number;
    items: string;
  };
  porVencer: {
    count: number;
    amount: number;
    items: string;
  };
  vigentes: {
    count: number;
    amount: number;
    items: string;
  };
  totalACobrar: {
    count: number;
    amount: number;
    items: string;
  };
}

export interface InvoiceCollection {
  id: string;
  invoiceNumber: string;
  cliente: string;
  vencimiento: string;
  dias: number;
  estado: "Vencida" | "Por Vencer" | "Vigente";
  monto: number;
  montoPendiente: number;
  montoPagado: number;
}

export interface CollectionsRepository {
  getCollectionsMetrics(distributorId: string): Promise<CollectionsMetrics>;
  getInvoicesForCollection(distributorId: string): Promise<InvoiceCollection[]>;
}

class CollectionsRepositoryImpl implements CollectionsRepository {
  async getCollectionsMetrics(
    distributorId: string,
  ): Promise<CollectionsMetrics> {
    const today = new Date();

    // Since the new schema entities might not be fully available yet,
    // let's use order-based queries with the updated logic

    // Facturas Vencidas (overdue invoices)
    const facturasVencidas = await prisma.order.aggregate({
      where: {
        distributorId,
        paymentStatus: {
          in: ["PENDING", "PARTIAL"],
        },
        createdAt: {
          lt: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });

    // Por Vencer (due within 7 days) - orders from last week
    const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const porVencer = await prisma.order.aggregate({
      where: {
        distributorId,
        paymentStatus: {
          in: ["PENDING", "PARTIAL"],
        },
        createdAt: {
          gte: sevenDaysAgo,
          lt: thirtyDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });

    // Vigentes (current invoices) - recent orders
    const vigentes = await prisma.order.aggregate({
      where: {
        distributorId,
        paymentStatus: {
          in: ["PENDING", "PARTIAL"],
        },
        createdAt: {
          gte: sevenDaysAgo,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });

    // Total a Cobrar (all unpaid orders)
    const totalACobrar = await prisma.order.aggregate({
      where: {
        distributorId,
        paymentStatus: {
          in: ["PENDING", "PARTIAL"],
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });

    return {
      facturasVencidas: {
        count: facturasVencidas._count.id,
        amount: Number(facturasVencidas._sum.total || 0),
        items: `${facturasVencidas._count.id} facturas vencidas`,
      },
      porVencer: {
        count: porVencer._count.id,
        amount: Number(porVencer._sum.total || 0),
        items: `${porVencer._count.id} factura${porVencer._count.id !== 1 ? "s" : ""} próxima${porVencer._count.id !== 1 ? "s" : ""} a vencer`,
      },
      vigentes: {
        count: vigentes._count.id,
        amount: Number(vigentes._sum.total || 0),
        items: `${vigentes._count.id} factura${vigentes._count.id !== 1 ? "s" : ""} vigente${vigentes._count.id !== 1 ? "s" : ""}`,
      },
      totalACobrar: {
        count: totalACobrar._count.id,
        amount: Number(totalACobrar._sum.total || 0),
        items: `${totalACobrar._count.id} facturas pendientes`,
      },
    };
  }

  async getInvoicesForCollection(
    distributorId: string,
  ): Promise<InvoiceCollection[]> {
    // For now, use orders until Invoice/Collection models are fully ready
    const orders = await prisma.order.findMany({
      where: {
        distributorId,
        paymentStatus: {
          in: ["PENDING", "PARTIAL"],
        },
      },
      include: {
        client: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    const today = new Date();

    return orders.map((order) => {
      // Calculate days since order creation
      const timeDiff = today.getTime() - order.createdAt.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      let estado: "Vencida" | "Por Vencer" | "Vigente";
      if (daysDiff > 30) {
        estado = "Vencida";
      } else if (daysDiff > 7) {
        estado = "Por Vencer";
      } else {
        estado = "Vigente";
      }

      // For now, assume full amount is pending
      const montoPagado =
        order.paymentStatus === "PARTIAL" ? Number(order.total) * 0.5 : 0;

      return {
        id: order.orderNumber,
        invoiceNumber: order.orderNumber,
        cliente: order.client?.name || "Cliente no especificado",
        vencimiento: order.createdAt.toISOString().split("T")[0],
        dias: daysDiff,
        estado,
        monto: Number(order.total),
        montoPendiente: Number(order.total) - montoPagado,
        montoPagado,
      };
    });
  }
}

export const collectionsRepo = new CollectionsRepositoryImpl();
