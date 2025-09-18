import { PrismaClient } from "@prisma/client";

export interface StockItem {
  id: string;
  name: string;
  sku: string;
  stock: number;
  price: number;
  isActive: boolean;
}

export interface DetailedStockItem {
  id: string;
  stock: number;
  lotNumber: string;
  expirationDate: Date;
  product: {
    id: string;
    name: string;
    sku: string;
    price: number;
    isActive: boolean;
  };
}

export interface StockRepository {
  getAllForDistributor(distributorId: string): Promise<StockItem[]>;
  getAllByDistributor(distributorId: string): Promise<DetailedStockItem[]>;
  searchDetailedByDistributor(
    distributorId: string,
    query: string,
  ): Promise<DetailedStockItem[]>;
  findById(id: string): Promise<DetailedStockItem | null>;
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
  adjustStock(
    inventoryItemId: string,
    quantity: number,
    type: "INBOUND" | "OUTBOUND" | "ADJUSTMENT",
    reason: string,
  ): Promise<void>;
  addNewStock(
    distributorId: string,
    stockData: {
      productName: string;
      sku: string;
      price: number;
      description?: string | null;
      stock: number;
      lotNumber: string;
      expirationDate: Date;
    },
  ): Promise<DetailedStockItem>;
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
      id: item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      stock: item.stock,
      price: Number(item.product.price),
      isActive: item.product.isActive,
    }));
  }

  async getAllByDistributor(
    distributorId: string,
  ): Promise<DetailedStockItem[]> {
    console.log("🗄️ Consultando stock para distributorId:", distributorId);

    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        distributorId: distributorId,
      },
      include: {
        product: true,
      },
      orderBy: {
        product: {
          name: "asc",
        },
      },
    });

    console.log(
      "🗄️ Items encontrados en la base de datos:",
      inventoryItems.length,
    );

    return inventoryItems.map((item) => ({
      id: item.id,
      stock: item.stock,
      lotNumber: item.lotNumber,
      expirationDate: item.expirationDate,
      product: {
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        price: Number(item.product.price),
        isActive: item.product.isActive,
      },
    }));
  }

  async searchDetailedByDistributor(
    distributorId: string,
    query: string,
  ): Promise<DetailedStockItem[]> {
    if (!query.trim()) return [];

    const terms = query
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        distributorId: distributorId,
        OR: [
          // Buscar en nombre del producto
          {
            product: {
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
          // Buscar en número de lote
          {
            OR: terms.map((term) => ({
              lotNumber: {
                contains: term,
                mode: "insensitive",
              },
            })),
          },
        ],
      },
      include: {
        product: true,
      },
      orderBy: {
        product: {
          name: "asc",
        },
      },
    });

    return inventoryItems.map((item) => ({
      id: item.id,
      stock: item.stock,
      lotNumber: item.lotNumber,
      expirationDate: item.expirationDate,
      product: {
        id: item.product.id,
        name: item.product.name,
        sku: item.product.sku,
        price: Number(item.product.price),
        isActive: item.product.isActive,
      },
    }));
  }

  async findById(id: string): Promise<DetailedStockItem | null> {
    const inventoryItem = await this.prisma.inventoryItem.findUnique({
      where: { id },
      include: {
        product: true,
      },
    });

    if (!inventoryItem) return null;

    return {
      id: inventoryItem.id,
      stock: inventoryItem.stock,
      lotNumber: inventoryItem.lotNumber,
      expirationDate: inventoryItem.expirationDate,
      product: {
        id: inventoryItem.product.id,
        name: inventoryItem.product.name,
        sku: inventoryItem.product.sku,
        price: Number(inventoryItem.product.price),
        isActive: inventoryItem.product.isActive,
      },
    };
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
      id: item.product.id,
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
      id: inventoryItem.product.id,
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

  async adjustStock(
    inventoryItemId: string,
    quantity: number,
    type: "INBOUND" | "OUTBOUND" | "ADJUSTMENT",
    reason: string,
  ): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const currentItem = await tx.inventoryItem.findUnique({
        where: { id: inventoryItemId },
      });

      if (!currentItem) {
        throw new Error(`Inventory item with ID ${inventoryItemId} not found`);
      }

      let newStock: number;
      if (type === "INBOUND") {
        newStock = currentItem.stock + quantity;
      } else if (type === "OUTBOUND") {
        if (currentItem.stock < quantity) {
          throw new Error(
            `Insufficient stock. Available: ${currentItem.stock}, requested: ${quantity}`,
          );
        }
        newStock = currentItem.stock - quantity;
      } else {
        // ADJUSTMENT
        newStock = Math.max(0, quantity); // For adjustments, quantity is the new total
      }

      await tx.inventoryItem.update({
        where: { id: inventoryItemId },
        data: { stock: newStock },
      });

      await tx.stockMovement.create({
        data: {
          inventoryItemId: inventoryItemId,
          type: type,
          quantity: quantity,
          previousStock: currentItem.stock,
          newStock: newStock,
          reason: reason,
        },
      });
    });
  }

  async addNewStock(
    distributorId: string,
    stockData: {
      productName: string;
      sku: string;
      price: number;
      description?: string | null;
      stock: number;
      lotNumber: string;
      expirationDate: Date;
    },
  ): Promise<DetailedStockItem> {
    // Verificar que el SKU no exista ya para esta distribuidora
    const existingProduct = await this.prisma.product.findFirst({
      where: {
        distributorId: distributorId,
        sku: stockData.sku,
      },
    });

    if (existingProduct) {
      throw new Error(
        `Ya existe un producto con el SKU ${stockData.sku} en esta distribuidora`,
      );
    }

    // Crear el producto y item de inventario en una transacción
    const result = await this.prisma.$transaction(async (tx) => {
      // Crear el producto
      const product = await tx.product.create({
        data: {
          distributorId: distributorId,
          name: stockData.productName,
          sku: stockData.sku,
          price: stockData.price,
          description: stockData.description,
          isActive: true,
        },
      });

      // Crear el item de inventario
      const inventoryItem = await tx.inventoryItem.create({
        data: {
          distributorId: distributorId,
          productId: product.id,
          stock: stockData.stock,
          lotNumber: stockData.lotNumber,
          expirationDate: stockData.expirationDate,
        },
        include: {
          product: true,
        },
      });

      // Crear el movimiento de stock inicial
      await tx.stockMovement.create({
        data: {
          inventoryItemId: inventoryItem.id,
          type: "INBOUND",
          quantity: stockData.stock,
          previousStock: 0,
          newStock: stockData.stock,
          reason: "Stock inicial agregado al sistema",
        },
      });

      return inventoryItem;
    });

    return {
      id: result.id,
      stock: result.stock,
      lotNumber: result.lotNumber,
      expirationDate: result.expirationDate,
      product: {
        id: result.product.id,
        name: result.product.name,
        sku: result.product.sku,
        price: Number(result.product.price),
        isActive: result.product.isActive,
      },
    };
  }
}

const prisma = new PrismaClient();
export const stockRepo = new PrismaStockRepository(prisma);
