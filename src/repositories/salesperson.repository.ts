import { PrismaClient } from "@prisma/client";

export interface Salesperson {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  territory: string | null;
  distributorId: string;
  isActive: boolean;
}

export interface SalespersonRepository {
  listForDistributor(distributorId: string): Promise<Salesperson[]>;
  findByIdForDistributor(
    distributorId: string,
    salespersonId: string,
  ): Promise<Salesperson | null>;
}

export class PrismaSalespersonRepository implements SalespersonRepository {
  constructor(private prisma: PrismaClient) {}

  async listForDistributor(distributorId: string): Promise<Salesperson[]> {
    const salespeople = await this.prisma.salesperson.findMany({
      where: {
        distributorId: distributorId,
      },
      include: {
        // Since Salesperson doesn't have a direct relation to User,
        // we'll need to use raw query or create a separate query to get user data
      },
    });

    // For now, we'll need to fetch user data separately since there's no direct relation
    const salespeopleWithUserData: Salesperson[] = [];

    for (const salesperson of salespeople) {
      // This is a workaround since the Salesperson model has userId but no relation defined
      const user = await this.prisma.user.findUnique({
        where: { id: salesperson.userId },
      });

      if (user) {
        salespeopleWithUserData.push({
          id: salesperson.id,
          name: user.name,
          email: user.email,
          phone: salesperson.phone || user.phone,
          territory: salesperson.territory,
          distributorId: salesperson.distributorId,
          isActive: user.isActive,
        });
      }
    }

    return salespeopleWithUserData;
  }

  async findByIdForDistributor(
    distributorId: string,
    salespersonId: string,
  ): Promise<Salesperson | null> {
    const salesperson = await this.prisma.salesperson.findFirst({
      where: {
        id: salespersonId,
        distributorId: distributorId,
      },
    });

    if (!salesperson) {
      return null;
    }

    const user = await this.prisma.user.findUnique({
      where: { id: salesperson.userId },
    });

    if (!user) {
      return null;
    }

    return {
      id: salesperson.id,
      name: user.name,
      email: user.email,
      phone: salesperson.phone || user.phone,
      territory: salesperson.territory,
      distributorId: salesperson.distributorId,
      isActive: user.isActive,
    };
  }
}

const prisma = new PrismaClient();
export const salespersonRepo = new PrismaSalespersonRepository(prisma);
