import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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
        phone: phone,
      },
      select: { distributorId: true },
    });

    return salesperson?.distributorId || null;
  }

  async getSalespersonIdByPhone(phone: string): Promise<string | null> {
    const salesperson = await this.prisma.salesperson.findFirst({
      where: {
        phone: phone,
      },
      select: { id: true },
    });

    return salesperson?.id || null;
  }
}

export const userRepo = new PrismaUserRepository(prisma);
