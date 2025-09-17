import { catalogRepo, CatalogItem } from "@/repositories/catalog.repository";
import {
  orderRepo,
  CreateOrderInput,
  OrderWithItems,
} from "@/repositories/order.repository";

export interface CatalogService {
  getCatalogForDistributor(distributorId: string): Promise<CatalogItem[]>;
  searchProductsByKeyword(
    distributorId: string,
    keyword: string,
  ): Promise<CatalogItem[]>;
  createOrder(
    distributorId: string,
    orderData: CreateOrderInput,
  ): Promise<OrderWithItems>;
  findProductsBySkus(
    distributorId: string,
    skus: string[],
  ): Promise<CatalogItem[]>;
}

class CatalogServiceImpl implements CatalogService {
  async getCatalogForDistributor(
    distributorId: string,
  ): Promise<CatalogItem[]> {
    return catalogRepo.getProductsForDistributor(distributorId);
  }

  async searchProductsByKeyword(
    distributorId: string,
    keyword: string,
  ): Promise<CatalogItem[]> {
    if (!keyword.trim()) {
      return [];
    }
    return catalogRepo.searchProductsByKeyword(distributorId, keyword.trim());
  }

  async findProductsBySkus(
    distributorId: string,
    skus: string[],
  ): Promise<CatalogItem[]> {
    if (skus.length === 0) {
      return [];
    }
    return catalogRepo.getProductsBySkus(distributorId, skus);
  }

  async createOrder(
    distributorId: string,
    orderData: CreateOrderInput,
  ): Promise<OrderWithItems> {
    if (orderData.items.length === 0) {
      throw new Error("La orden debe tener al menos un producto");
    }

    const productSkus = orderData.items.map((item) => item.sku);
    const availableProducts = await catalogRepo.getProductsBySkus(
      distributorId,
      productSkus,
    );

    const validatedItems = orderData.items.map((item) => {
      const product = availableProducts.find((p) => p.sku === item.sku);
      if (!product) {
        throw new Error(
          `Producto con SKU ${item.sku} no encontrado en el catálogo de la distribuidora`,
        );
      }
      if (product.stock < item.quantity) {
        throw new Error(
          `Stock insuficiente para el producto ${product.name} (${item.sku}). Stock disponible: ${product.stock}, solicitado: ${item.quantity}`,
        );
      }

      return {
        productId: product.id,
        sku: product.sku,
        quantity: item.quantity,
        price: product.price,
      };
    });

    const validatedOrderData = {
      ...orderData,
      items: validatedItems,
    };

    return orderRepo.createOrder(validatedOrderData);
  }
}

export const catalogService = new CatalogServiceImpl();
