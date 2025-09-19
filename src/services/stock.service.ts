import { PrismaClient } from "@prisma/client";

export interface StockItemWithProduct {
  id: string;
  productId: string;
  distributorId: string;
  stock: number;
  lotNumber: string;
  expirationDate: Date;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    name: string;
    description: string | null;
    sku: string;
    price: number;
    discountedPrice?: number;
    discount?: number;
    isActive: boolean;
  };
}

export interface StockMovementData {
  type: "INBOUND" | "OUTBOUND" | "ADJUSTMENT" | "TRANSFER";
  quantity: number;
  reason?: string;
  orderId?: string;
}

export interface UpdateStockData {
  stock?: number;
  lotNumber?: string;
  expirationDate?: Date;
}

export interface CreateProductWithStockData {
  // Datos del producto
  name: string;
  description?: string;
  sku: string;
  price: number;
  discountedPrice?: number;
  discount?: number;
  distributorId: string;
  // Datos del inventario inicial
  initialStock: number;
  lotNumber: string;
  expirationDate: Date;
}

export class StockService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  // Obtener todo el stock de una distribuidora
  async getAllStockByDistributor(
    distributorId: string,
  ): Promise<StockItemWithProduct[]> {
    try {
      const stockItems = await this.prisma.inventoryItem.findMany({
        where: {
          distributorId: distributorId,
          product: {
            isActive: true,
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              sku: true,
              price: true,
              discountedPrice: true,
              discount: true,
              isActive: true,
            },
          },
        },
        orderBy: [{ product: { name: "asc" } }, { expirationDate: "asc" }],
      });

      return stockItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        distributorId: item.distributorId,
        stock: item.stock,
        lotNumber: item.lotNumber,
        expirationDate: item.expirationDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          sku: item.product.sku,
          price: Number(item.product.price),
          discountedPrice: item.product.discountedPrice
            ? Number(item.product.discountedPrice)
            : undefined,
          discount: item.product.discount
            ? Number(item.product.discount)
            : undefined,
          isActive: item.product.isActive,
        },
      }));
    } catch (error) {
      console.error("Error fetching stock by distributor:", error);
      throw new Error("Failed to fetch stock");
    }
  }

  // Obtener stock bajo (menos de X unidades)
  async getLowStockByDistributor(
    distributorId: string,
    threshold: number = 10,
  ): Promise<StockItemWithProduct[]> {
    try {
      const stockItems = await this.prisma.inventoryItem.findMany({
        where: {
          distributorId: distributorId,
          stock: {
            lte: threshold,
          },
          product: {
            isActive: true,
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              sku: true,
              price: true,
              discountedPrice: true,
              discount: true,
              isActive: true,
            },
          },
        },
        orderBy: [{ stock: "asc" }, { product: { name: "asc" } }],
      });

      return stockItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        distributorId: item.distributorId,
        stock: item.stock,
        lotNumber: item.lotNumber,
        expirationDate: item.expirationDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          sku: item.product.sku,
          price: Number(item.product.price),
          discountedPrice: item.product.discountedPrice
            ? Number(item.product.discountedPrice)
            : undefined,
          discount: item.product.discount
            ? Number(item.product.discount)
            : undefined,
          isActive: item.product.isActive,
        },
      }));
    } catch (error) {
      console.error("Error fetching low stock:", error);
      throw new Error("Failed to fetch low stock");
    }
  }

  // Obtener productos próximos a vencer
  async getExpiringStockByDistributor(
    distributorId: string,
    daysFromNow: number = 30,
  ): Promise<StockItemWithProduct[]> {
    try {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + daysFromNow);

      const stockItems = await this.prisma.inventoryItem.findMany({
        where: {
          distributorId: distributorId,
          expirationDate: {
            lte: futureDate,
          },
          stock: {
            gt: 0, // Solo productos con stock
          },
          product: {
            isActive: true,
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              sku: true,
              price: true,
              discountedPrice: true,
              discount: true,
              isActive: true,
            },
          },
        },
        orderBy: [{ expirationDate: "asc" }, { product: { name: "asc" } }],
      });

      return stockItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        distributorId: item.distributorId,
        stock: item.stock,
        lotNumber: item.lotNumber,
        expirationDate: item.expirationDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          sku: item.product.sku,
          price: Number(item.product.price),
          discountedPrice: item.product.discountedPrice
            ? Number(item.product.discountedPrice)
            : undefined,
          discount: item.product.discount
            ? Number(item.product.discount)
            : undefined,
          isActive: item.product.isActive,
        },
      }));
    } catch (error) {
      console.error("Error fetching expiring stock:", error);
      throw new Error("Failed to fetch expiring stock");
    }
  }

  // Obtener stock por producto
  async getStockByProduct(productId: string): Promise<StockItemWithProduct[]> {
    try {
      const stockItems = await this.prisma.inventoryItem.findMany({
        where: {
          productId: productId,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              sku: true,
              price: true,
              discountedPrice: true,
              discount: true,
              isActive: true,
            },
          },
        },
        orderBy: [{ expirationDate: "asc" }],
      });

      return stockItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        distributorId: item.distributorId,
        stock: item.stock,
        lotNumber: item.lotNumber,
        expirationDate: item.expirationDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          sku: item.product.sku,
          price: Number(item.product.price),
          discountedPrice: item.product.discountedPrice
            ? Number(item.product.discountedPrice)
            : undefined,
          discount: item.product.discount
            ? Number(item.product.discount)
            : undefined,
          isActive: item.product.isActive,
        },
      }));
    } catch (error) {
      console.error("Error fetching stock by product:", error);
      throw new Error("Failed to fetch stock by product");
    }
  }

  // Buscar productos por nombre o SKU
  async searchStock(
    distributorId: string,
    query: string,
  ): Promise<StockItemWithProduct[]> {
    try {
      // Dividir la query en palabras individuales y limpiar
      const searchTerms = query
        .trim()
        .toLowerCase()
        .split(/\s+/) // Dividir por espacios
        .filter((term) => term.length > 0) // Filtrar términos vacíos
        .map((term) => term.replace(/[^\w\s]/g, "")); // Remover caracteres especiales

      if (searchTerms.length === 0) {
        return [];
      }

      // Construir condiciones OR para cada término de búsqueda
      const searchConditions = searchTerms.map((term) => ({
        OR: [
          {
            name: {
              contains: term,
              mode: "insensitive" as const,
            },
          },
          {
            sku: {
              contains: term,
              mode: "insensitive" as const,
            },
          },
          {
            description: {
              contains: term,
              mode: "insensitive" as const,
            },
          },
        ],
      }));

      const stockItems = await this.prisma.inventoryItem.findMany({
        where: {
          distributorId: distributorId,
          product: {
            isActive: true,
            // Todas las condiciones de búsqueda deben cumplirse (AND)
            AND: searchConditions,
          },
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              sku: true,
              price: true,
              discountedPrice: true,
              discount: true,
              isActive: true,
            },
          },
        },
        orderBy: [{ product: { name: "asc" } }, { expirationDate: "asc" }],
      });

      return stockItems.map((item) => ({
        id: item.id,
        productId: item.productId,
        distributorId: item.distributorId,
        stock: item.stock,
        lotNumber: item.lotNumber,
        expirationDate: item.expirationDate,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          sku: item.product.sku,
          price: Number(item.product.price),
          discountedPrice: item.product.discountedPrice
            ? Number(item.product.discountedPrice)
            : undefined,
          discount: item.product.discount
            ? Number(item.product.discount)
            : undefined,
          isActive: item.product.isActive,
        },
      }));
    } catch (error) {
      console.error("Error searching stock:", error);
      throw new Error("Failed to search stock");
    }
  }

  // Actualizar stock
  async updateStock(
    inventoryItemId: string,
    updateData: UpdateStockData,
  ): Promise<StockItemWithProduct> {
    try {
      const updatedItem = await this.prisma.inventoryItem.update({
        where: {
          id: inventoryItemId,
        },
        data: updateData,
        include: {
          product: {
            select: {
              id: true,
              name: true,
              description: true,
              sku: true,
              price: true,
              discountedPrice: true,
              discount: true,
              isActive: true,
            },
          },
        },
      });

      return {
        id: updatedItem.id,
        productId: updatedItem.productId,
        distributorId: updatedItem.distributorId,
        stock: updatedItem.stock,
        lotNumber: updatedItem.lotNumber,
        expirationDate: updatedItem.expirationDate,
        createdAt: updatedItem.createdAt,
        updatedAt: updatedItem.updatedAt,
        product: {
          id: updatedItem.product.id,
          name: updatedItem.product.name,
          description: updatedItem.product.description,
          sku: updatedItem.product.sku,
          price: Number(updatedItem.product.price),
          discountedPrice: updatedItem.product.discountedPrice
            ? Number(updatedItem.product.discountedPrice)
            : undefined,
          discount: updatedItem.product.discount
            ? Number(updatedItem.product.discount)
            : undefined,
          isActive: updatedItem.product.isActive,
        },
      };
    } catch (error) {
      console.error("Error updating stock:", error);
      throw new Error("Failed to update stock");
    }
  }

  // Crear movimiento de stock
  async createStockMovement(
    inventoryItemId: string,
    movementData: StockMovementData,
  ): Promise<void> {
    try {
      // Primero obtenemos el item actual
      const currentItem = await this.prisma.inventoryItem.findUnique({
        where: { id: inventoryItemId },
      });

      if (!currentItem) {
        throw new Error("Inventory item not found");
      }

      const previousStock = currentItem.stock;
      let newStock: number;

      // Calculamos el nuevo stock basado en el tipo de movimiento
      switch (movementData.type) {
        case "INBOUND":
          newStock = previousStock + movementData.quantity;
          break;
        case "OUTBOUND":
          newStock = Math.max(0, previousStock - movementData.quantity);
          break;
        case "ADJUSTMENT":
          newStock = movementData.quantity;
          break;
        case "TRANSFER":
          newStock = Math.max(0, previousStock - movementData.quantity);
          break;
        default:
          throw new Error("Invalid stock movement type");
      }

      // Realizamos ambas operaciones en una transacción
      await this.prisma.$transaction([
        // Actualizar el stock del inventory item
        this.prisma.inventoryItem.update({
          where: { id: inventoryItemId },
          data: { stock: newStock },
        }),
        // Crear el registro del movimiento
        this.prisma.stockMovement.create({
          data: {
            inventoryItemId,
            type: movementData.type,
            quantity: movementData.quantity,
            previousStock,
            newStock,
            reason: movementData.reason,
            orderId: movementData.orderId,
          },
        }),
      ]);
    } catch (error) {
      console.error("Error creating stock movement:", error);
      throw new Error("Failed to create stock movement");
    }
  }

  // Obtener historial de movimientos de stock
  async getStockMovementHistory(inventoryItemId: string) {
    try {
      const movements = await this.prisma.stockMovement.findMany({
        where: {
          inventoryItemId: inventoryItemId,
        },
        orderBy: {
          createdAt: "desc",
        },
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
        },
      });

      return movements;
    } catch (error) {
      console.error("Error fetching stock movement history:", error);
      throw new Error("Failed to fetch stock movement history");
    }
  }

  // Obtener todos los movimientos de stock de una distribuidora
  async getAllStockMovementsByDistributor(
    distributorId: string,
    limit: number = 50,
    offset: number = 0,
  ) {
    try {
      const movements = await this.prisma.stockMovement.findMany({
        where: {
          inventoryItem: {
            distributorId: distributorId,
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: limit,
        skip: offset,
        include: {
          inventoryItem: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  sku: true,
                },
              },
            },
          },
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
        },
      });

      // Obtener el total de movimientos para paginación
      const total = await this.prisma.stockMovement.count({
        where: {
          inventoryItem: {
            distributorId: distributorId,
          },
        },
      });

      return {
        movements: movements.map((movement) => ({
          id: movement.id,
          type: movement.type,
          quantity: movement.quantity,
          previousStock: movement.previousStock,
          newStock: movement.newStock,
          reason: movement.reason,
          createdAt: movement.createdAt,
          product: {
            id: movement.inventoryItem.product.id,
            name: movement.inventoryItem.product.name,
            sku: movement.inventoryItem.product.sku,
          },
          lotNumber: movement.inventoryItem.lotNumber,
          order: movement.order
            ? {
                id: movement.order.id,
                orderNumber: movement.order.orderNumber,
              }
            : null,
        })),
        total,
        hasMore: offset + limit < total,
      };
    } catch (error) {
      console.error("Error fetching all stock movements:", error);
      throw new Error("Failed to fetch stock movements");
    }
  }

  // Obtener stock total de un producto (suma de todos los lotes)
  async getTotalStockForProduct(
    distributorId: string,
    productId: string,
  ): Promise<number> {
    try {
      const result = await this.prisma.inventoryItem.aggregate({
        where: {
          distributorId: distributorId,
          productId: productId,
        },
        _sum: {
          stock: true,
        },
      });

      return result._sum.stock || 0;
    } catch (error) {
      console.error("Error getting total stock for product:", error);
      throw new Error("Failed to get total stock for product");
    }
  }

  // Crear producto con stock inicial en una sola transacción
  async createProductWithStock(
    data: CreateProductWithStockData,
  ): Promise<StockItemWithProduct> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Verificar que el distribuidor existe
        const distributor = await tx.distributor.findUnique({
          where: { id: data.distributorId },
        });

        if (!distributor || !distributor.isActive) {
          throw new Error("Distribuidor no encontrado o inactivo");
        }

        // Verificar si ya existe un producto con el mismo SKU para este distribuidor
        const existingProduct = await tx.product.findFirst({
          where: {
            sku: data.sku,
            distributorId: data.distributorId,
          },
        });

        if (existingProduct) {
          throw new Error(
            "Ya existe un producto con este SKU para esta distribuidora",
          );
        }

        // Crear el producto
        const product = await tx.product.create({
          data: {
            name: data.name,
            description: data.description,
            sku: data.sku,
            price: data.price,
            discountedPrice: data.discountedPrice,
            discount: data.discount,
            distributorId: data.distributorId,
            isActive: true,
          },
        });

        // Crear el item de inventario con stock inicial
        const inventoryItem = await tx.inventoryItem.create({
          data: {
            productId: product.id,
            distributorId: data.distributorId,
            stock: data.initialStock,
            lotNumber: data.lotNumber,
            expirationDate: data.expirationDate,
          },
        });

        // Si hay stock inicial, crear un movimiento de entrada
        if (data.initialStock > 0) {
          await tx.stockMovement.create({
            data: {
              inventoryItemId: inventoryItem.id,
              type: "INBOUND",
              quantity: data.initialStock,
              previousStock: 0,
              newStock: data.initialStock,
              reason: "Stock inicial del producto",
            },
          });
        }

        // Retornar el item completo con el producto
        return {
          id: inventoryItem.id,
          productId: inventoryItem.productId,
          distributorId: inventoryItem.distributorId,
          stock: inventoryItem.stock,
          lotNumber: inventoryItem.lotNumber,
          expirationDate: inventoryItem.expirationDate,
          createdAt: inventoryItem.createdAt,
          updatedAt: inventoryItem.updatedAt,
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            sku: product.sku,
            price: Number(product.price),
            discountedPrice: product.discountedPrice
              ? Number(product.discountedPrice)
              : undefined,
            discount: product.discount ? Number(product.discount) : undefined,
            isActive: product.isActive,
          },
        };
      });

      return result;
    } catch (error) {
      console.error("Error creating product with stock:", error);
      throw error;
    }
  }

  // Agregar stock a un producto existente (crear nuevo lote)
  async addStockToProduct(data: {
    productId: string;
    distributorId: string;
    quantity: number;
    lotNumber: string;
    expirationDate: Date;
    reason?: string;
  }): Promise<StockItemWithProduct> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Verificar que el producto existe y pertenece a la distribuidora
        const product = await tx.product.findFirst({
          where: {
            id: data.productId,
            distributorId: data.distributorId,
            isActive: true,
          },
        });

        if (!product) {
          throw new Error("Producto no encontrado o no activo");
        }

        // Verificar que no existe otro lote con el mismo número
        const existingLot = await tx.inventoryItem.findFirst({
          where: {
            productId: data.productId,
            lotNumber: data.lotNumber,
          },
        });

        if (existingLot) {
          throw new Error(
            "Ya existe un lote con este número para este producto",
          );
        }

        // Crear el nuevo item de inventario
        const inventoryItem = await tx.inventoryItem.create({
          data: {
            productId: data.productId,
            distributorId: data.distributorId,
            stock: data.quantity,
            lotNumber: data.lotNumber,
            expirationDate: data.expirationDate,
          },
        });

        // Crear movimiento de entrada
        await tx.stockMovement.create({
          data: {
            inventoryItemId: inventoryItem.id,
            type: "INBOUND",
            quantity: data.quantity,
            previousStock: 0,
            newStock: data.quantity,
            reason: data.reason || "Nuevo lote agregado",
          },
        });

        return {
          id: inventoryItem.id,
          productId: inventoryItem.productId,
          distributorId: inventoryItem.distributorId,
          stock: inventoryItem.stock,
          lotNumber: inventoryItem.lotNumber,
          expirationDate: inventoryItem.expirationDate,
          createdAt: inventoryItem.createdAt,
          updatedAt: inventoryItem.updatedAt,
          product: {
            id: product.id,
            name: product.name,
            description: product.description,
            sku: product.sku,
            price: Number(product.price),
            discountedPrice: product.discountedPrice
              ? Number(product.discountedPrice)
              : undefined,
            discount: product.discount ? Number(product.discount) : undefined,
            isActive: product.isActive,
          },
        };
      });

      return result;
    } catch (error) {
      console.error("Error adding stock to product:", error);
      throw error;
    }
  }

  // Eliminar producto (soft delete - marcar como inactivo)
  async deleteProduct(productId: string, distributorId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx) => {
        // Verificar que el producto pertenece a la distribuidora
        const product = await tx.product.findFirst({
          where: {
            id: productId,
            distributorId: distributorId,
          },
        });

        if (!product) {
          throw new Error(
            "Producto no encontrado o no pertenece a esta distribuidora",
          );
        }

        // Marcar el producto como inactivo (soft delete)
        await tx.product.update({
          where: { id: productId },
          data: { isActive: false },
        });

        // Crear movimientos de salida para todo el stock restante
        const inventoryItems = await tx.inventoryItem.findMany({
          where: {
            productId: productId,
            stock: { gt: 0 },
          },
        });

        for (const item of inventoryItems) {
          // Crear movimiento de ajuste a 0
          await tx.stockMovement.create({
            data: {
              inventoryItemId: item.id,
              type: "ADJUSTMENT",
              quantity: 0,
              previousStock: item.stock,
              newStock: 0,
              reason: "Producto eliminado",
            },
          });

          // Actualizar el stock a 0
          await tx.inventoryItem.update({
            where: { id: item.id },
            data: { stock: 0 },
          });
        }
      });
    } catch (error) {
      console.error("Error deleting product:", error);
      throw error;
    }
  }
}

export const stockService = new StockService();
