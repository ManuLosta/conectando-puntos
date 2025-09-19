import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface UserRepository {
  getSalespersonDistributor(salespersonId: string): Promise<string | null>;
  getSalespersonDistributorByPhone(phone: string): Promise<string | null>;
  getSalespersonIdByPhone(phone: string): Promise<string | null>;
  getClientByPhone(
    phone: string,
  ): Promise<{ id: string; distributorId: string } | null>;
  isClientPhone(phone: string): Promise<boolean>;
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

  async getClientByPhone(
    phone: string,
  ): Promise<{ id: string; distributorId: string } | null> {
    const client = await this.prisma.client.findFirst({
      where: {
        phone: phone,
      },
      select: {
        id: true,
        distributorId: true,
      },
    });

    return client || null;
  }

  async isClientPhone(phone: string): Promise<boolean> {
    const client = await this.getClientByPhone(phone);
    return client !== null;
  }
}

export const userRepo = new PrismaUserRepository(prisma);
