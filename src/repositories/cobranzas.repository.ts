import { PrismaClient } from "@prisma/client";

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
  constructor(private prisma: PrismaClient) {}

  async getCollectionsMetrics(
    distributorId: string,
  ): Promise<CollectionsMetrics> {
    const today = new Date();

    // Facturas Vencidas (overdue invoices)
    const facturasVencidas = await this.prisma.invoice.aggregate({
      where: {
        distributorId,
        status: {
          in: ["PENDING", "SENT", "OVERDUE"],
        },
        dueDate: {
          lt: today,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });

    // Por Vencer (due within 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(today.getDate() + 7);

    const porVencer = await this.prisma.invoice.aggregate({
      where: {
        distributorId,
        status: {
          in: ["PENDING", "SENT"],
        },
        dueDate: {
          gte: today,
          lte: sevenDaysFromNow,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });

    // Vigentes (current invoices - due in more than 7 days)
    const vigentes = await this.prisma.invoice.aggregate({
      where: {
        distributorId,
        status: {
          in: ["PENDING", "SENT"],
        },
        dueDate: {
          gt: sevenDaysFromNow,
        },
      },
      _count: {
        id: true,
      },
      _sum: {
        total: true,
      },
    });

    // Total a Cobrar (all unpaid invoices)
    const totalACobrar = await this.prisma.invoice.aggregate({
      where: {
        distributorId,
        status: {
          in: ["PENDING", "SENT", "OVERDUE"],
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
    const invoices = await this.prisma.invoice.findMany({
      where: {
        distributorId,
        status: {
          in: ["PENDING", "SENT", "OVERDUE"],
        },
      },
      include: {
        client: true,
        collections: {
          where: {
            status: {
              in: ["COMPLETED", "PARTIAL"],
            },
          },
        },
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    const today = new Date();

    return invoices.map((invoice) => {
      // Calculate days until/past due
      const timeDiff = invoice.dueDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      let estado: "Vencida" | "Por Vencer" | "Vigente";
      if (daysDiff < 0) {
        estado = "Vencida";
      } else if (daysDiff <= 7) {
        estado = "Por Vencer";
      } else {
        estado = "Vigente";
      }

      // Calculate paid amount from collections
      const montoPagado = invoice.collections.reduce((sum, collection) => {
        return sum + Number(collection.amountPaid);
      }, 0);

      return {
        id: invoice.invoiceNumber,
        invoiceNumber: invoice.invoiceNumber,
        cliente: invoice.client?.name || "Cliente no especificado",
        vencimiento: invoice.dueDate.toISOString().split("T")[0],
        dias: daysDiff,
        estado,
        monto: Number(invoice.total),
        montoPendiente: Number(invoice.total) - montoPagado,
        montoPagado,
      };
    });
  }
}

const prisma = new PrismaClient();
export const collectionsRepo = new CollectionsRepositoryImpl(prisma);
