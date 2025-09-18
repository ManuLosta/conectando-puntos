import { PrismaClient, PaymentStatus } from "@prisma/client";

export interface CobranzasMetrics {
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

export interface FacturaCobranza {
  id: string;
  orderNumber: string;
  cliente: string;
  vencimiento: string;
  dias: number;
  estado: "Vencida" | "Por Vencer" | "Vigente";
  monto: number;
}

export interface CobranzasRepository {
  getCobranzasMetrics(distributorId: string): Promise<CobranzasMetrics>;
  getFacturasCobranza(distributorId: string): Promise<FacturaCobranza[]>;
}

class CobranzasRepositoryImpl implements CobranzasRepository {
  constructor(private prisma: PrismaClient) {}

  async getCobranzasMetrics(distributorId: string): Promise<CobranzasMetrics> {
    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);

    const sevenDaysAgoFromDue = new Date();
    sevenDaysAgoFromDue.setDate(today.getDate() - 23);

    // Facturas Vencidas (created more than 30 days ago and still pending payment)
    const facturasVencidas = await this.prisma.order.aggregate({
      where: {
        distributorId,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: {
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

    // Por Vencer (created between 23-30 days ago, will be due in 7 days)
    const porVencer = await this.prisma.order.aggregate({
      where: {
        distributorId,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: {
          gte: sevenDaysAgoFromDue,
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

    // Vigentes (created less than 23 days ago)
    const vigentes = await this.prisma.order.aggregate({
      where: {
        distributorId,
        paymentStatus: PaymentStatus.PENDING,
        createdAt: {
          gte: sevenDaysAgoFromDue,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });

    // Total a Cobrar (all pending payments)
    const totalACobrar = await this.prisma.order.aggregate({
      where: {
        distributorId,
        paymentStatus: PaymentStatus.PENDING,
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

  async getFacturasCobranza(distributorId: string): Promise<FacturaCobranza[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        distributorId,
        paymentStatus: PaymentStatus.PENDING,
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
      // Calculate due date as 30 days from creation
      const dueDate = new Date(order.createdAt);
      dueDate.setDate(dueDate.getDate() + 30);

      // Calculate days until/past due
      const timeDiff = dueDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      let estado: "Vencida" | "Por Vencer" | "Vigente";
      if (daysDiff < 0) {
        estado = "Vencida";
      } else if (daysDiff <= 7) {
        estado = "Por Vencer";
      } else {
        estado = "Vigente";
      }

      return {
        id: order.orderNumber,
        orderNumber: order.orderNumber,
        cliente: order.client?.name || "Cliente no especificado",
        vencimiento: dueDate.toISOString().split("T")[0],
        dias: daysDiff,
        estado,
        monto: Number(order.total),
      };
    });
  }
}

const prisma = new PrismaClient();
export const cobranzasRepo = new CobranzasRepositoryImpl(prisma);
