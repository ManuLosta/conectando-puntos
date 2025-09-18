import { stockRepo, DetailedStockItem } from "@/repositories/stock.repository";
import { StockSearchResult } from "@/domain/stock.dto";

export interface StockService {
  searchForDistributor(
    distributorId: string,
    query: string,
  ): Promise<StockSearchResult[]>;
  getAllStockByDistributor(distributorId: string): Promise<DetailedStockItem[]>;
  searchStockByDistributor(
    distributorId: string,
    query: string,
  ): Promise<DetailedStockItem[]>;
  getStockById(id: string): Promise<DetailedStockItem | null>;
  adjustStock(
    inventoryItemId: string,
    quantity: number,
    type: "increase" | "decrease",
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

class StockServiceImpl implements StockService {
  async searchForDistributor(
    distributorId: string,
    query: string,
  ): Promise<StockSearchResult[]> {
    if (!distributorId) {
      throw new Error("DistributorId is required for stock operations");
    }
    const stockItems = await stockRepo.searchForDistributor(
      distributorId,
      query,
    );
    return stockItems.map((item) => ({
      id: item.id,
      sku: item.sku,
      name: item.name,
      price: item.price,
      availableStock: item.stock,
    }));
  }

  async getAllStockByDistributor(
    distributorId: string,
  ): Promise<DetailedStockItem[]> {
    if (!distributorId) {
      throw new Error("DistributorId is required for stock operations");
    }
    return await stockRepo.getAllByDistributor(distributorId);
  }

  async searchStockByDistributor(
    distributorId: string,
    query: string,
  ): Promise<DetailedStockItem[]> {
    if (!distributorId) {
      throw new Error("DistributorId is required for stock operations");
    }
    return await stockRepo.searchDetailedByDistributor(distributorId, query);
  }

  async getStockById(id: string): Promise<DetailedStockItem | null> {
    return await stockRepo.findById(id);
  }

  async adjustStock(
    inventoryItemId: string,
    quantity: number,
    type: "increase" | "decrease",
    reason: string,
  ): Promise<void> {
    const movementType = type === "increase" ? "INBOUND" : "OUTBOUND";
    await stockRepo.adjustStock(
      inventoryItemId,
      quantity,
      movementType,
      reason,
    );
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
    if (!distributorId) {
      throw new Error("DistributorId is required for stock operations");
    }
    return await stockRepo.addNewStock(distributorId, stockData);
  }
}

export const stockService = new StockServiceImpl();
