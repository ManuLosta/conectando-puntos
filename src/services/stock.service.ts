import { stockRepo } from "@/repositories/stock.repository";
import { StockSearchResult } from "@/domain/stock.dto";

export interface StockService {
  searchForDistributor(
    distributorId: string,
    query: string,
  ): Promise<StockSearchResult[]>;
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
}

export const stockService = new StockServiceImpl();
