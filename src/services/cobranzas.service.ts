import { collectionsRepo } from "@/repositories/collections.repository";
import type {
  CollectionsMetrics,
  InvoiceCollection,
  CreateCollectionData,
  UpdateCollectionData,
  CollectionDetails,
} from "@/repositories/collections.repository";
import { PaymentType, CollectionStatus } from "@prisma/client";

export interface CollectionsService {
  // Metrics and reporting
  getCollectionsMetrics(distributorId: string): Promise<CollectionsMetrics>;
  getInvoicesForCollection(distributorId: string): Promise<InvoiceCollection[]>;

  // Collection management
  createCollection(data: CreateCollectionData): Promise<CollectionDetails>;
  updateCollection(
    id: string,
    data: UpdateCollectionData,
  ): Promise<CollectionDetails>;
  getCollectionById(id: string): Promise<CollectionDetails | null>;
  getCollectionsByInvoice(invoiceId: string): Promise<CollectionDetails[]>;

  // Payment processing
  recordPayment(
    invoiceId: string,
    amount: number,
    paymentType: PaymentType,
    notes?: string,
  ): Promise<CollectionDetails>;
  markCollectionAsCompleted(id: string): Promise<CollectionDetails>;
  markCollectionAsFailed(
    id: string,
    reason?: string,
  ): Promise<CollectionDetails>;

  // Analytics
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

class CollectionsServiceImpl implements CollectionsService {
  async getCollectionsMetrics(
    distributorId: string,
  ): Promise<CollectionsMetrics> {
    return collectionsRepo.getCollectionsMetrics(distributorId);
  }

  async getInvoicesForCollection(
    distributorId: string,
  ): Promise<InvoiceCollection[]> {
    return collectionsRepo.getInvoicesForCollection(distributorId);
  }

  async createCollection(
    data: CreateCollectionData,
  ): Promise<CollectionDetails> {
    return collectionsRepo.createCollection(data);
  }

  async updateCollection(
    id: string,
    data: UpdateCollectionData,
  ): Promise<CollectionDetails> {
    return collectionsRepo.updateCollection(id, data);
  }

  async getCollectionById(id: string): Promise<CollectionDetails | null> {
    return collectionsRepo.getCollectionById(id);
  }

  async getCollectionsByInvoice(
    invoiceId: string,
  ): Promise<CollectionDetails[]> {
    return collectionsRepo.getCollectionsByInvoice(invoiceId);
  }

  async recordPayment(
    invoiceId: string,
    amount: number,
    paymentType: PaymentType,
    notes?: string,
  ): Promise<CollectionDetails> {
    // Generate a unique collection number
    const collectionNumber = `COL-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;

    const collectionData: CreateCollectionData = {
      collectionNumber,
      invoiceId,
      amountPaid: amount,
      paymentType,
      notes,
      collectionDate: new Date(),
      status: CollectionStatus.COMPLETED,
    };

    return collectionsRepo.createCollection(collectionData);
  }

  async markCollectionAsCompleted(id: string): Promise<CollectionDetails> {
    return collectionsRepo.updateCollection(id, {
      status: CollectionStatus.COMPLETED,
    });
  }

  async markCollectionAsFailed(
    id: string,
    reason?: string,
  ): Promise<CollectionDetails> {
    return collectionsRepo.updateCollection(id, {
      status: CollectionStatus.FAILED,
      notes: reason,
    });
  }

  async getCollectionHistory(
    distributorId: string,
    startDate?: Date,
    endDate?: Date,
  ): Promise<CollectionDetails[]> {
    return collectionsRepo.getCollectionHistory(
      distributorId,
      startDate,
      endDate,
    );
  }

  async getCollectionStats(distributorId: string): Promise<{
    totalCollected: number;
    pendingAmount: number;
    successRate: number;
    averageCollectionTime: number;
  }> {
    return collectionsRepo.getCollectionStats(distributorId);
  }
}

export const collectionsService = new CollectionsServiceImpl();

// Re-export types for convenience
export type { CollectionsMetrics, InvoiceCollection };

// Legacy exports for backward compatibility during transition
export const cobranzasService = collectionsService;
export type CobranzasMetrics = CollectionsMetrics;
export type FacturaCobranza = InvoiceCollection;
