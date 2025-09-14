import { PrismaClient } from '@prisma/client';

export interface CatalogItem {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  price: number;
  stock: number;
  isActive: boolean;
}

export interface CatalogRepository {
  getProductsForDistributor(distributorId: string): Promise<CatalogItem[]>;
  searchProductsByKeyword(distributorId: string, keyword: string): Promise<CatalogItem[]>;
  getProductBySku(distributorId: string, sku: string): Promise<CatalogItem | null>;
  getProductsBySkus(distributorId: string, skus: string[]): Promise<CatalogItem[]>;
}

export class PrismaCatalogRepository implements CatalogRepository {
  constructor(private prisma: PrismaClient) {}

  async getProductsForDistributor(distributorId: string): Promise<CatalogItem[]> {
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        distributorId: distributorId,
        product: {
          isActive: true
        }
      },
      include: {
        product: true
      }
    });

    return inventoryItems.map(item => ({
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      sku: item.product.sku,
      price: Number(item.product.price),
      stock: item.stock,
      isActive: item.product.isActive
    }));
  }

  async searchProductsByKeyword(distributorId: string, keyword: string): Promise<CatalogItem[]> {
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        distributorId: distributorId,
        product: {
          isActive: true,
          OR: [
            {
              name: {
                contains: keyword,
                mode: 'insensitive'
              }
            },
            {
              sku: {
                startsWith: keyword,
                mode: 'insensitive'
              }
            }
          ]
        }
      },
      include: {
        product: true
      }
    });

    return inventoryItems.map(item => ({
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      sku: item.product.sku,
      price: Number(item.product.price),
      stock: item.stock,
      isActive: item.product.isActive
    }));
  }

  async getProductBySku(distributorId: string, sku: string): Promise<CatalogItem | null> {
    const inventoryItem = await this.prisma.inventoryItem.findFirst({
      where: {
        distributorId: distributorId,
        product: {
          sku: sku,
          isActive: true
        }
      },
      include: {
        product: true
      }
    });

    if (!inventoryItem) return null;

    return {
      id: inventoryItem.product.id,
      name: inventoryItem.product.name,
      description: inventoryItem.product.description,
      sku: inventoryItem.product.sku,
      price: Number(inventoryItem.product.price),
      stock: inventoryItem.stock,
      isActive: inventoryItem.product.isActive
    };
  }

  async getProductsBySkus(distributorId: string, skus: string[]): Promise<CatalogItem[]> {
    const inventoryItems = await this.prisma.inventoryItem.findMany({
      where: {
        distributorId: distributorId,
        product: {
          sku: {
            in: skus
          },
          isActive: true
        }
      },
      include: {
        product: true
      }
    });

    return inventoryItems.map(item => ({
      id: item.product.id,
      name: item.product.name,
      description: item.product.description,
      sku: item.product.sku,
      price: Number(item.product.price),
      stock: item.stock,
      isActive: item.product.isActive
    }));
  }
}

const prisma = new PrismaClient();
export const catalogRepo = new PrismaCatalogRepository(prisma);