import { PrismaClient, StockMovementType } from "@prisma/client";

export interface StockMovementWithDetails {
  id: string;
  type: StockMovementType;
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string | null;
  createdAt: Date;
  inventoryItem: {
    id: string;
    lotNumber: string;
    expirationDate: Date;
    product: {
      id: string;
      name: string;
      sku: string;
      price: number;
    };
  };
  order: {
    id: string;
    orderNumber: string;
  } | null;
}

export interface StockMovementRepository {
  getAllByDistributor(
    distributorId: string,
  ): Promise<StockMovementWithDetails[]>;
  getByType(
    distributorId: string,
    type: StockMovementType,
  ): Promise<StockMovementWithDetails[]>;
  getByProduct(productId: string): Promise<StockMovementWithDetails[]>;
  getRecentMovements(
    distributorId: string,
    limit?: number,
  ): Promise<StockMovementWithDetails[]>;
}

export class PrismaStockMovementRepository implements StockMovementRepository {
  constructor(private prisma: PrismaClient) {}

  async getAllByDistributor(
    distributorId: string,
  ): Promise<StockMovementWithDetails[]> {
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        inventoryItem: {
          distributorId: distributorId,
        },
      },
      include: {
        inventoryItem: {
          include: {
            product: true,
          },
        },
        order: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return movements.map((movement) => ({
      id: movement.id,
      type: movement.type,
      quantity: movement.quantity,
      previousStock: movement.previousStock,
      newStock: movement.newStock,
      reason: movement.reason,
      createdAt: movement.createdAt,
      inventoryItem: {
        id: movement.inventoryItem.id,
        lotNumber: movement.inventoryItem.lotNumber,
        expirationDate: movement.inventoryItem.expirationDate,
        product: {
          id: movement.inventoryItem.product.id,
          name: movement.inventoryItem.product.name,
          sku: movement.inventoryItem.product.sku,
          price: Number(movement.inventoryItem.product.price),
        },
      },
      order: movement.order
        ? {
            id: movement.order.id,
            orderNumber: movement.order.orderNumber,
          }
        : null,
    }));
  }

  async getByType(
    distributorId: string,
    type: StockMovementType,
  ): Promise<StockMovementWithDetails[]> {
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        type: type,
        inventoryItem: {
          distributorId: distributorId,
        },
      },
      include: {
        inventoryItem: {
          include: {
            product: true,
          },
        },
        order: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return movements.map((movement) => ({
      id: movement.id,
      type: movement.type,
      quantity: movement.quantity,
      previousStock: movement.previousStock,
      newStock: movement.newStock,
      reason: movement.reason,
      createdAt: movement.createdAt,
      inventoryItem: {
        id: movement.inventoryItem.id,
        lotNumber: movement.inventoryItem.lotNumber,
        expirationDate: movement.inventoryItem.expirationDate,
        product: {
          id: movement.inventoryItem.product.id,
          name: movement.inventoryItem.product.name,
          sku: movement.inventoryItem.product.sku,
          price: Number(movement.inventoryItem.product.price),
        },
      },
      order: movement.order
        ? {
            id: movement.order.id,
            orderNumber: movement.order.orderNumber,
          }
        : null,
    }));
  }

  async getByProduct(productId: string): Promise<StockMovementWithDetails[]> {
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        inventoryItem: {
          productId: productId,
        },
      },
      include: {
        inventoryItem: {
          include: {
            product: true,
          },
        },
        order: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return movements.map((movement) => ({
      id: movement.id,
      type: movement.type,
      quantity: movement.quantity,
      previousStock: movement.previousStock,
      newStock: movement.newStock,
      reason: movement.reason,
      createdAt: movement.createdAt,
      inventoryItem: {
        id: movement.inventoryItem.id,
        lotNumber: movement.inventoryItem.lotNumber,
        expirationDate: movement.inventoryItem.expirationDate,
        product: {
          id: movement.inventoryItem.product.id,
          name: movement.inventoryItem.product.name,
          sku: movement.inventoryItem.product.sku,
          price: Number(movement.inventoryItem.product.price),
        },
      },
      order: movement.order
        ? {
            id: movement.order.id,
            orderNumber: movement.order.orderNumber,
          }
        : null,
    }));
  }

  async getRecentMovements(
    distributorId: string,
    limit = 50,
  ): Promise<StockMovementWithDetails[]> {
    const movements = await this.prisma.stockMovement.findMany({
      where: {
        inventoryItem: {
          distributorId: distributorId,
        },
      },
      include: {
        inventoryItem: {
          include: {
            product: true,
          },
        },
        order: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
    });

    return movements.map((movement) => ({
      id: movement.id,
      type: movement.type,
      quantity: movement.quantity,
      previousStock: movement.previousStock,
      newStock: movement.newStock,
      reason: movement.reason,
      createdAt: movement.createdAt,
      inventoryItem: {
        id: movement.inventoryItem.id,
        lotNumber: movement.inventoryItem.lotNumber,
        expirationDate: movement.inventoryItem.expirationDate,
        product: {
          id: movement.inventoryItem.product.id,
          name: movement.inventoryItem.product.name,
          sku: movement.inventoryItem.product.sku,
          price: Number(movement.inventoryItem.product.price),
        },
      },
      order: movement.order
        ? {
            id: movement.order.id,
            orderNumber: movement.order.orderNumber,
          }
        : null,
    }));
  }
}

const prisma = new PrismaClient();
export const stockMovementRepo = new PrismaStockMovementRepository(prisma);
