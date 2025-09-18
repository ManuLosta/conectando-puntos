import {
  PrismaSalespersonRepository,
  CreateSalespersonInput,
} from "@/repositories/salesperson.repository";
import { Salesperson } from "@/repositories/salesperson.repository";
import { withTenant } from "@/lib/tenant-context";

export interface SalespersonService {
  listForDistributor(distributorId: string): Promise<Salesperson[]>;
  findByIdForDistributor(
    distributorId: string,
    salespersonId: string,
  ): Promise<Salesperson | null>;
  createForDistributor(
    distributorId: string,
    data: CreateSalespersonInput,
  ): Promise<Salesperson>;
}

class SalespersonServiceImpl implements SalespersonService {
  async listForDistributor(
    distributorId: string,
    options?: { bypassRls?: boolean; userId?: string },
  ) {
    const { bypassRls = false, userId = "system" } = options ?? {};
    return withTenant({ userId, distributorId, bypassRls }, async (tx) =>
      new PrismaSalespersonRepository(tx).listForDistributor(distributorId),
    );
  }

  async findByIdForDistributor(
    distributorId: string,
    salespersonId: string,
    options?: { bypassRls?: boolean; userId?: string },
  ) {
    const { bypassRls = false, userId = "system" } = options ?? {};
    return withTenant({ userId, distributorId, bypassRls }, async (tx) =>
      new PrismaSalespersonRepository(tx).findByIdForDistributor(
        distributorId,
        salespersonId,
      ),
    );
  }

  async createForDistributor(
    distributorId: string,
    data: CreateSalespersonInput,
    options?: { bypassRls?: boolean; userId?: string },
  ) {
    const { bypassRls = false, userId = "system" } = options ?? {};
    return withTenant({ userId, distributorId, bypassRls }, async (tx) =>
      new PrismaSalespersonRepository(tx).createForDistributor(
        distributorId,
        data,
      ),
    );
  }
}

export const salespersonService = new SalespersonServiceImpl();
