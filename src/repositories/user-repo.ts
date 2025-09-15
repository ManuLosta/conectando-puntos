import { PrismaClient } from "@prisma/client";

export interface UserRepository {
  getSalespersonDistributor(salespersonId: string): Promise<string | null>;
  getSalespersonDistributorByPhone(phone: string): Promise<string | null>;
  getSalespersonIdByPhone(phone: string): Promise<string | null>;
}

export class PrismaUserRepository implements UserRepository {
  constructor(private prisma: PrismaClient) {}

  async getSalespersonDistributor(
    salespersonId: string,
  ): Promise<string | null> {
    const salesperson = await this.prisma.salesperson.findUnique({
      where: { id: salespersonId },
      select: { distributorId: true },
    });

    return salesperson?.distributorId || null;
  }

  async getSalespersonDistributorByPhone(
    phone: string,
  ): Promise<string | null> {
    const salesperson = await this.prisma.salesperson.findFirst({
      where: {
        user: {
          phone: phone,
          role: "SALESPERSON",
          isActive: true,
        },
      },
      select: { distributorId: true },
    });

    return salesperson?.distributorId || null;
  }

  async getSalespersonIdByPhone(phone: string): Promise<string | null> {
    const salesperson = await this.prisma.salesperson.findFirst({
      where: {
        user: {
          phone: phone,
          role: "SALESPERSON",
          isActive: true,
        },
      },
      select: { id: true },
    });

    return salesperson?.id || null;
  }
}

const prisma = new PrismaClient();
export const userRepo = new PrismaUserRepository(prisma);
