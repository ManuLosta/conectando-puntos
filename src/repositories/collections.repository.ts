import { prisma } from "@/lib/prisma";
import { PaymentType, CollectionStatus } from "@prisma/client";

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
  clientPhone?: string;
  clientEmail?: string;
  vencimiento: string;
  dias: number;
  estado: "Vencida" | "Por Vencer" | "Vigente";
  monto: number;
  montoPendiente: number;
  montoPagado: number;
}

export interface CreateCollectionData {
  collectionNumber: string;
  invoiceId: string;
  amountPaid: number;
  paymentType: PaymentType;
  notes?: string;
  collectionDate: Date;
  status: CollectionStatus;
}

export interface UpdateCollectionData {
  status?: CollectionStatus;
  notes?: string;
  amountPaid?: number;
  paymentType?: PaymentType;
}

export interface CollectionDetails {
  id: string;
  collectionNumber: string;
  invoiceId: string;
  amountPaid: number;
  paymentType: PaymentType;
  notes?: string;
  collectionDate: Date;
  status: CollectionStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollectionsRepository {
  getCollectionsMetrics(distributorId: string): Promise<CollectionsMetrics>;
  getInvoicesForCollection(distributorId: string): Promise<InvoiceCollection[]>;
  createCollection(data: CreateCollectionData): Promise<CollectionDetails>;
  updateCollection(
    id: string,
    data: UpdateCollectionData,
  ): Promise<CollectionDetails>;
  getCollectionById(id: string): Promise<CollectionDetails | null>;
  getCollectionsByInvoice(invoiceId: string): Promise<CollectionDetails[]>;
  getCollectionHistory(
    distributorId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CollectionDetails[]>;
  getCollectionStats(distributorId: string): Promise<{
    totalCollected: number;
    pendingAmount: number;
    successRate: number;
    averageCollectionTime: number;
  }>;
}

class CollectionsRepositoryImpl implements CollectionsRepository {
  async getCollectionsMetrics(
    distributorId: string,
  ): Promise<CollectionsMetrics> {
    const today = new Date();

    // Get ALL invoices from confirmed orders that are not fully paid
    const invoices = await prisma.invoice.findMany({
      where: {
        distributorId,
        status: {
          not: "PAID", // Exclude fully paid invoices
        },
        order: {
          status: "CONFIRMED", // Only confirmed orders
        },
      },
      include: {
        collections: {
          where: {
            status: {
              in: ["PENDING", "PARTIAL", "COMPLETED"],
            },
          },
        },
      },
    });

    // Initialize counters
    const facturasVencidas = { count: 0, amount: 0 };
    const porVencer = { count: 0, amount: 0 };
    const vigentes = { count: 0, amount: 0 };
    const totalACobrar = { count: 0, amount: 0 };

    // Process each invoice to determine its collection status
    invoices.forEach((invoice) => {
      const invoiceTotal = Number(invoice.total);

      // Calculate total paid from completed and partial collections
      const totalPaid = invoice.collections.reduce((sum, collection) => {
        if (
          collection.status === "COMPLETED" ||
          collection.status === "PARTIAL"
        ) {
          return sum + Number(collection.amountPaid);
        }
        return sum;
      }, 0);

      // Skip if fully paid
      if (totalPaid >= invoiceTotal) {
        return;
      }

      const pendingAmount = invoiceTotal - totalPaid;

      // Categorize based on due date
      const timeDiff = invoice.dueDate.getTime() - today.getTime();
      const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

      if (daysDiff < 0) {
        // Overdue
        facturasVencidas.count++;
        facturasVencidas.amount += pendingAmount;
      } else if (daysDiff <= 7) {
        // Due within 7 days
        porVencer.count++;
        porVencer.amount += pendingAmount;
      } else {
        // Future due date
        vigentes.count++;
        vigentes.amount += pendingAmount;
      }

      // Add to total
      totalACobrar.count++;
      totalACobrar.amount += pendingAmount;
    });

    return {
      facturasVencidas: {
        count: facturasVencidas.count,
        amount: facturasVencidas.amount,
        items: `${facturasVencidas.count} facturas vencidas`,
      },
      porVencer: {
        count: porVencer.count,
        amount: porVencer.amount,
        items: `${porVencer.count} factura${porVencer.count !== 1 ? "s" : ""} próxima${porVencer.count !== 1 ? "s" : ""} a vencer`,
      },
      vigentes: {
        count: vigentes.count,
        amount: vigentes.amount,
        items: `${vigentes.count} factura${vigentes.count !== 1 ? "s" : ""} vigente${vigentes.count !== 1 ? "s" : ""}`,
      },
      totalACobrar: {
        count: totalACobrar.count,
        amount: totalACobrar.amount,
        items: `${totalACobrar.count} facturas pendientes`,
      },
    };
  }

  async getInvoicesForCollection(
    distributorId: string,
  ): Promise<InvoiceCollection[]> {
    console.log("REPO: Getting invoices for distributor:", distributorId);

    // Get ALL invoices from confirmed orders (including those without collections yet)
    const invoices = await prisma.invoice.findMany({
      where: {
        distributorId,
        status: {
          not: "PAID", // Exclude fully paid invoices
        },
        order: {
          status: "CONFIRMED", // Only confirmed orders
        },
      },
      include: {
        client: true,
        order: {
          include: {
            client: true,
          },
        },
        collections: true, // Get all collections (not filtered)
      },
      orderBy: {
        dueDate: "asc",
      },
    });

    console.log("REPO: Found raw invoices:", invoices.length);

    const today = new Date();

    return invoices
      .map((invoice) => {
        // Calculate days until/since due date
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

        // Calculate total paid from completed and partial collections
        const montoPagado = invoice.collections.reduce((total, collection) => {
          if (
            collection.status === "COMPLETED" ||
            collection.status === "PARTIAL"
          ) {
            return total + Number(collection.amountPaid);
          }
          return total;
        }, 0);

        const monto = Number(invoice.total);
        const montoPendiente = monto - montoPagado;

        const client = invoice.client || invoice.order.client;

        return {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          cliente: client?.name || "Cliente no especificado",
          clientPhone: client?.phone || undefined,
          clientEmail: client?.email || undefined,
          vencimiento: invoice.dueDate.toISOString().split("T")[0],
          dias: daysDiff,
          estado,
          monto,
          montoPendiente,
          montoPagado,
        };
      })
      .filter((invoice) => invoice.montoPendiente > 0); // Only return invoices with pending amounts
  }

  async createCollection(
    data: CreateCollectionData,
  ): Promise<CollectionDetails> {
    // Get invoice to determine distributor and amount due
    const invoice = await prisma.invoice.findUnique({
      where: { id: data.invoiceId },
      include: { collections: true },
    });

    if (!invoice) {
      throw new Error("Invoice not found");
    }

    // Calculate remaining amount due
    const totalPaid = invoice.collections.reduce(
      (sum, collection) => sum + Number(collection.amountPaid),
      0,
    );
    const amountDue = Number(invoice.total) - totalPaid;

    // Use a transaction to create collection and update invoice status
    const result = await prisma.$transaction(async (tx) => {
      // Create the collection
      const collection = await tx.collection.create({
        data: {
          collectionNumber: data.collectionNumber,
          invoiceId: data.invoiceId,
          distributorId: invoice.distributorId,
          amountDue: amountDue,
          amountPaid: data.amountPaid,
          collectionDate: data.collectionDate,
          dueDate: invoice.dueDate,
          paymentType: data.paymentType,
          status: data.status,
          notes: data.notes,
        },
      });

      // Calculate new total paid including this collection
      const newTotalPaid = totalPaid + data.amountPaid;
      const invoiceTotal = Number(invoice.total);

      // Update collection and invoice status based on payment amount
      let collectionStatus = data.status;
      let invoiceStatus = invoice.status;

      if (newTotalPaid >= invoiceTotal) {
        // Full payment
        collectionStatus = "COMPLETED";
        invoiceStatus = "PAID";
      } else if (data.amountPaid < amountDue) {
        // Partial payment
        collectionStatus = "PARTIAL";
        invoiceStatus = "PENDING";
      } else {
        // Complete payment for this collection but may be partial for invoice
        collectionStatus = "COMPLETED";
        invoiceStatus = newTotalPaid >= invoiceTotal ? "PAID" : "PENDING";
      }

      // Update collection status
      let updatedCollection = collection;
      if (collectionStatus !== collection.status) {
        updatedCollection = await tx.collection.update({
          where: { id: collection.id },
          data: { status: collectionStatus },
        });
      }

      // Update invoice status
      if (invoiceStatus !== invoice.status) {
        await tx.invoice.update({
          where: { id: data.invoiceId },
          data: { status: invoiceStatus },
        });
      }

      return updatedCollection;
    });

    return {
      id: result.id,
      collectionNumber: result.collectionNumber,
      invoiceId: result.invoiceId,
      amountPaid: Number(result.amountPaid),
      paymentType: result.paymentType || PaymentType.CASH,
      notes: result.notes || undefined,
      collectionDate: result.collectionDate,
      status: result.status,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async updateCollection(
    id: string,
    data: UpdateCollectionData,
  ): Promise<CollectionDetails> {
    const updateData: {
      status?: CollectionStatus;
      notes?: string;
      amountPaid?: number;
      paymentType?: PaymentType;
    } = {};

    if (data.status) updateData.status = data.status;
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.amountPaid !== undefined) updateData.amountPaid = data.amountPaid;
    if (data.paymentType) updateData.paymentType = data.paymentType;

    // Use transaction to update collection and potentially invoice status
    const result = await prisma.$transaction(async (tx) => {
      // Update the collection
      const collection = await tx.collection.update({
        where: { id },
        data: updateData,
      });

      // If amount was updated, check if invoice should be marked as paid
      if (data.amountPaid !== undefined) {
        // Get the invoice and all its collections
        const invoice = await tx.invoice.findUnique({
          where: { id: collection.invoiceId },
          include: { collections: true },
        });

        if (invoice) {
          // Calculate total paid from all collections
          const totalPaid = invoice.collections.reduce(
            (sum, col) => sum + Number(col.amountPaid),
            0,
          );
          const invoiceTotal = Number(invoice.total);

          // Update invoice status based on payment
          if (totalPaid >= invoiceTotal && invoice.status !== "PAID") {
            await tx.invoice.update({
              where: { id: invoice.id },
              data: { status: "PAID" },
            });
          } else if (totalPaid < invoiceTotal && invoice.status === "PAID") {
            await tx.invoice.update({
              where: { id: invoice.id },
              data: { status: "PENDING" },
            });
          }
        }
      }

      return collection;
    });

    return {
      id: result.id,
      collectionNumber: result.collectionNumber,
      invoiceId: result.invoiceId,
      amountPaid: Number(result.amountPaid),
      paymentType: result.paymentType || PaymentType.CASH,
      notes: result.notes || undefined,
      collectionDate: result.collectionDate,
      status: result.status,
      createdAt: result.createdAt,
      updatedAt: result.updatedAt,
    };
  }

  async getCollectionById(id: string): Promise<CollectionDetails | null> {
    const collection = await prisma.collection.findUnique({
      where: { id },
    });

    if (!collection) return null;

    return {
      id: collection.id,
      collectionNumber: collection.collectionNumber,
      invoiceId: collection.invoiceId,
      amountPaid: Number(collection.amountPaid),
      paymentType: collection.paymentType || PaymentType.CASH,
      notes: collection.notes || undefined,
      collectionDate: collection.collectionDate,
      status: collection.status,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };
  }

  async getCollectionsByInvoice(
    invoiceId: string,
  ): Promise<CollectionDetails[]> {
    const collections = await prisma.collection.findMany({
      where: { invoiceId },
      orderBy: { createdAt: "desc" },
    });

    return collections.map((collection) => ({
      id: collection.id,
      collectionNumber: collection.collectionNumber,
      invoiceId: collection.invoiceId,
      amountPaid: Number(collection.amountPaid),
      paymentType: collection.paymentType || PaymentType.CASH,
      notes: collection.notes || undefined,
      collectionDate: collection.collectionDate,
      status: collection.status,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    }));
  }

  async getCollectionHistory(
    distributorId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CollectionDetails[]> {
    const whereClause: {
      distributorId: string;
      collectionDate?: {
        gte?: Date;
        lte?: Date;
      };
    } = { distributorId };

    if (startDate || endDate) {
      whereClause.collectionDate = {};
      if (startDate) whereClause.collectionDate.gte = startDate;
      if (endDate) whereClause.collectionDate.lte = endDate;
    }

    const collections = await prisma.collection.findMany({
      where: whereClause,
      orderBy: { collectionDate: "desc" },
    });

    return collections.map((collection) => ({
      id: collection.id,
      collectionNumber: collection.collectionNumber,
      invoiceId: collection.invoiceId,
      amountPaid: Number(collection.amountPaid),
      paymentType: collection.paymentType || PaymentType.CASH,
      notes: collection.notes || undefined,
      collectionDate: collection.collectionDate,
      status: collection.status,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    }));
  }

  async getCollectionStats(distributorId: string): Promise<{
    totalCollected: number;
    pendingAmount: number;
    successRate: number;
    averageCollectionTime: number;
  }> {
    // Get completed collections
    const completedCollections = await prisma.collection.aggregate({
      where: {
        distributorId,
        status: "COMPLETED",
      },
      _sum: {
        amountPaid: true,
      },
      _count: {
        id: true,
      },
    });

    // Get pending collections
    const pendingCollections = await prisma.collection.aggregate({
      where: {
        distributorId,
        status: {
          in: ["PENDING", "PARTIAL"],
        },
      },
      _sum: {
        amountDue: true,
        amountPaid: true,
      },
      _count: {
        id: true,
      },
    });

    // Get all collections for success rate
    const totalCollections = await prisma.collection.count({
      where: { distributorId },
    });

    // Calculate average collection time
    const collectionsWithTimes = await prisma.collection.findMany({
      where: {
        distributorId,
        status: "COMPLETED",
      },
      include: {
        invoice: true,
      },
    });

    const averageCollectionTime =
      collectionsWithTimes.length > 0
        ? collectionsWithTimes.reduce((sum, collection) => {
            const daysDiff = Math.ceil(
              (collection.collectionDate.getTime() -
                collection.invoice.issueDate.getTime()) /
                (1000 * 3600 * 24),
            );
            return sum + daysDiff;
          }, 0) / collectionsWithTimes.length
        : 0;

    const totalCollected = Number(completedCollections._sum.amountPaid || 0);
    const pendingAmountDue = Number(pendingCollections._sum.amountDue || 0);
    const pendingAmountPaid = Number(pendingCollections._sum.amountPaid || 0);
    const pendingAmount = pendingAmountDue - pendingAmountPaid;
    const successRate =
      totalCollections > 0
        ? (completedCollections._count.id / totalCollections) * 100
        : 0;

    return {
      totalCollected,
      pendingAmount,
      successRate,
      averageCollectionTime,
    };
  }
}

export const collectionsRepo = new CollectionsRepositoryImpl();
