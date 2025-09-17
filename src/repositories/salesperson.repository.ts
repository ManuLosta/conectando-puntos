import { PrismaClient, Prisma } from "@prisma/client";

export interface Salesperson {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  territory: string | null;
  distributorId: string;
}

export interface SalespersonRepository {
  listForDistributor(distributorId: string): Promise<Salesperson[]>;
  findByIdForDistributor(
    distributorId: string,
    salespersonId: string,
  ): Promise<Salesperson | null>;
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
        userId: true,
        phone: true,
        territory: true,
        distributorId: true,
      },
    });

    // Batch load users to avoid N+1 queries
    const userIds = salespeople.map((s) => s.userId);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, email: true },
    });
    const userById = new Map(users.map((u) => [u.id, u]));

    const result: Salesperson[] = salespeople
      .map((s) => {
        const user = userById.get(s.userId);
        if (!user) return null;
        return {
          id: s.id,
          name: user.name,
          email: user.email,
          phone: s.phone,
          territory: s.territory,
          distributorId: s.distributorId,
        } as Salesperson;
      })
      .filter(Boolean) as Salesperson[];

    return result;
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
        userId: true,
        phone: true,
        territory: true,
        distributorId: true,
      },
    });

    if (!salesperson) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: salesperson.userId },
      select: { id: true, name: true, email: true },
    });

    if (!user) {
      return null;
    }

    return {
      id: salesperson.id,
      name: user.name,
      email: user.email,
      phone: salesperson.phone,
      territory: salesperson.territory,
      distributorId: salesperson.distributorId,
    };
  }
}

const prisma = new PrismaClient();
export const salespersonRepo = new PrismaSalespersonRepository(prisma);
