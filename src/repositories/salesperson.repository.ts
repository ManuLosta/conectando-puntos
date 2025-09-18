import { PrismaClient, Prisma } from "@prisma/client";

export interface Salesperson {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  territory: string | null;
  distributorId: string;
}

export interface CreateSalespersonInput {
  name: string;
  email: string;
  phone?: string;
  territory?: string;
}

export interface SalespersonRepository {
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

export class PrismaSalespersonRepository implements SalespersonRepository {
  constructor(private prisma: PrismaClient | Prisma.TransactionClient) {}

  async listForDistributor(distributorId: string): Promise<Salesperson[]> {
    const salespeople = await this.prisma.salesperson.findMany({
      where: {
        distributorId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        territory: true,
        distributorId: true,
      },
    });

    return salespeople;
  }

  async findByIdForDistributor(
    distributorId: string,
    salespersonId: string,
  ): Promise<Salesperson | null> {
    const salesperson = await this.prisma.salesperson.findFirst({
      where: {
        id: salespersonId,
        distributorId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        territory: true,
        distributorId: true,
      },
    });

    return salesperson;
  }

  async createForDistributor(
    distributorId: string,
    data: CreateSalespersonInput,
  ): Promise<Salesperson> {
    const salesperson = await this.prisma.salesperson.create({
      data: {
        name: data.name,
        email: data.email,
        distributorId,
        phone: data.phone || null,
        territory: data.territory || null,
      },
    });

    return salesperson;
  }
}

const prisma = new PrismaClient();
export const salespersonRepo = new PrismaSalespersonRepository(prisma);
