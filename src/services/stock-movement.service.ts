import {
  stockMovementRepo,
  StockMovementWithDetails,
} from "@/repositories/stock-movement.repository";
import { StockMovementType } from "@prisma/client";

export interface StockMovementService {
  getAllMovementsByDistributor(
    distributorId: string,
  ): Promise<StockMovementWithDetails[]>;
  getMovementsByType(
    distributorId: string,
    type: StockMovementType,
  ): Promise<StockMovementWithDetails[]>;
  getMovementsByProduct(productId: string): Promise<StockMovementWithDetails[]>;
  getRecentMovements(
    distributorId: string,
    limit?: number,
  ): Promise<StockMovementWithDetails[]>;
}

class StockMovementServiceImpl implements StockMovementService {
  async getAllMovementsByDistributor(
    distributorId: string,
  ): Promise<StockMovementWithDetails[]> {
    if (!distributorId) {
      throw new Error(
        "DistributorId is required for stock movement operations",
      );
    }
    return await stockMovementRepo.getAllByDistributor(distributorId);
  }

  async getMovementsByType(
    distributorId: string,
    type: StockMovementType,
  ): Promise<StockMovementWithDetails[]> {
    if (!distributorId) {
      throw new Error(
        "DistributorId is required for stock movement operations",
      );
    }
    return await stockMovementRepo.getByType(distributorId, type);
  }

  async getMovementsByProduct(
    productId: string,
  ): Promise<StockMovementWithDetails[]> {
    if (!productId) {
      throw new Error("ProductId is required for stock movement operations");
    }
    return await stockMovementRepo.getByProduct(productId);
  }

  async getRecentMovements(
    distributorId: string,
    limit = 50,
  ): Promise<StockMovementWithDetails[]> {
    if (!distributorId) {
      throw new Error(
        "DistributorId is required for stock movement operations",
      );
    }
    return await stockMovementRepo.getRecentMovements(distributorId, limit);
  }
}

export const stockMovementService = new StockMovementServiceImpl();
