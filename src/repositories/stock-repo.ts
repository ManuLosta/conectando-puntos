import { PrismaClient } from "@prisma/client";

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  isActive: boolean;
}

export interface StockRepository {
  getAllForDistributor(distributorId: string): Promise<StockItem[]>;
  searchForDistributor(
    distributorId: string,
    query: string,
  ): Promise<StockItem[]>;
  getBySkuForDistributor(
    distributorId: string,
    sku: string,
  ): Promise<StockItem | null>;
  decrementStock(
    distributorId: string,
    sku: string,
    qty: number,
  ): Promise<void>;
}

export class PrismaStockRepository implements StockRepository {
  constructor(private prisma: PrismaClient) {}

  async getAllForDistributor(distributorId: string): Promise<StockItem[]> {
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        product: {
          distributorId: distributorId,
          isActive: true,
        },
      },
      include: {
        product: true,
      },
    });

    return inventoryItems.map((item) => ({
      id: item.id,
      name: item.product.name,
      sku: item.product.sku,
      stock: item.stock,
      price: Number(item.product.price),
      isActive: item.product.isActive,
    }));
  }

  async searchForDistributor(
    distributorId: string,
    query: string,
  ): Promise<StockItem[]> {
    if (!query.trim()) return [];

    const terms = query
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        product: {
          distributorId: distributorId,
          isActive: true,
          OR: terms.flatMap((term) => [
            {
              name: {
                contains: term,
                mode: "insensitive",
              },
            },
            {
              sku: {
                contains: term,
                mode: "insensitive",
              },
            },
          ]),
        },
      },
      include: {
        product: true,
      },
    });

    return inventoryItems.map((item) => ({
      id: item.id,
      name: item.product.name,
      sku: item.product.sku,
      stock: item.stock,
      price: Number(item.product.price),
      isActive: item.product.isActive,
    }));
  }

  async getBySkuForDistributor(
    distributorId: string,
    sku: string,
  ): Promise<StockItem | null> {
    const inventoryItem = await this.prisma.inventoryItem.findFirst({
      where: {
        product: {
          distributorId: distributorId,
          sku: sku,
          isActive: true,
        },
      },
      include: {
        product: true,
      },
    });

    if (!inventoryItem) return null;

    return {
      id: inventoryItem.id,
      name: inventoryItem.product.name,
      sku: inventoryItem.product.sku,
      stock: inventoryItem.stock,
      price: Number(inventoryItem.product.price),
      isActive: inventoryItem.product.isActive,
    };
  }

  async decrementStock(
    distributorId: string,
    sku: string,
    qty: number,
  ): Promise<void> {
    const inventoryItem = await this.prisma.inventoryItem.findFirst({
      where: {
        product: {
          distributorId: distributorId,
          sku: sku,
        },
      },
    });

    if (!inventoryItem) {
      throw new Error(
        `Product with SKU ${sku} not found in distributor inventory`,
      );
    }

    await this.prisma.$transaction(async (tx) => {
      const currentItem = await tx.inventoryItem.findUnique({
        where: { id: inventoryItem.id },
      });

      if (!currentItem || currentItem.stock < qty) {
        throw new Error(
          `Insufficient stock for SKU ${sku}. Available: ${currentItem?.stock || 0}, requested: ${qty}`,
        );
      }

      const newStock = Math.max(0, currentItem.stock - qty);

      await tx.inventoryItem.update({
        where: { id: inventoryItem.id },
        data: { stock: newStock },
      });

      await tx.stockMovement.create({
        data: {
          inventoryItemId: inventoryItem.id,
          type: "OUTBOUND",
          quantity: qty,
          previousStock: currentItem.stock,
          newStock: newStock,
          reason: "Order fulfillment",
        },
      });
    });
  }
}

const prisma = new PrismaClient();
export const stockRepo = new PrismaStockRepository(prisma);
