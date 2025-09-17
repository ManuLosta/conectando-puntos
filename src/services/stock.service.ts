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
    // Ensure tenant isolation by always filtering by distributorId
    if (!distributorId) {
      throw new Error("DistributorId is required for stock operations");
    }
    return stockRepo.searchForDistributor(distributorId, query);
  }
}

export const stockService = new StockServiceImpl();
