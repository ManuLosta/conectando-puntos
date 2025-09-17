import { salespersonRepo } from "@/repositories/salesperson.repository";
import { Salesperson } from "@/repositories/salesperson.repository";

export interface SalespersonService {
  listForDistributor(distributorId: string): Promise<Salesperson[]>;
  findByIdForDistributor(
    distributorId: string,
    salespersonId: string,
  ): Promise<Salesperson | null>;
  getSalesStatsForDistributor(
    distributorId: string,
    salespersonId: string,
  ): Promise<{
    totalSold: number;
    salesThisMonth: number;
    clientsCount: number;
    lastSaleDate: string | null;
  }>;
}

class SalespersonServiceImpl implements SalespersonService {
  async listForDistributor(distributorId: string) {
    return salespersonRepo.listForDistributor(distributorId);
  }

  async findByIdForDistributor(distributorId: string, salespersonId: string) {
    return salespersonRepo.findByIdForDistributor(distributorId, salespersonId);
  }

  async getSalesStatsForDistributor(
    distributorId: string,
    salespersonId: string,
  ) {
    // This would require additional repository methods to get order data
    // For now, return mock data
    // TODO: Implement real sales statistics from orders
    return {
      totalSold: Math.floor(Math.random() * 50000) + 10000,
      salesThisMonth: Math.floor(Math.random() * 15000) + 3000,
      clientsCount: Math.floor(Math.random() * 20) + 5,
      lastSaleDate: new Date(2024, 0, Math.floor(Math.random() * 15) + 1)
        .toISOString()
        .split("T")[0],
    };
  }
}

export const salespersonService = new SalespersonServiceImpl();
