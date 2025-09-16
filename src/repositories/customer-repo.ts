import { PrismaClient } from "@prisma/client";

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  city?: string;
  postalCode?: string;
}

export interface CustomerRepository {
  listForDistributor(distributorId: string): Promise<Customer[]>;
  findByIdForDistributor(
    distributorId: string,
    clientId: string,
  ): Promise<Customer | null>;
  findByNameForDistributor(
    distributorId: string,
    name: string,
  ): Promise<Customer | null>;
  findByPhoneForDistributor(
    distributorId: string,
    phone: string,
  ): Promise<Customer | null>;
  existsForDistributor(distributorId: string, name: string): Promise<boolean>;
  searchForDistributor(
    distributorId: string,
    query: string,
  ): Promise<Customer[]>;
}

export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private prisma: PrismaClient) {}

  async listForDistributor(distributorId: string): Promise<Customer[]> {
    const clientDistributors = await this.prisma.clientDistributor.findMany({
      where: {
        distributorId: distributorId,
      },
      include: {
        client: true,
      },
    });

    return clientDistributors.map((cd) => ({
      id: cd.client.id,
      name: cd.client.name,
      phone: cd.client.phone || undefined,
      address: cd.client.address || undefined,
      city: cd.client.city || undefined,
      postalCode: cd.client.postalCode || undefined,
    }));
  }

  async findByNameForDistributor(
    distributorId: string,
    name: string,
  ): Promise<Customer | null> {
    const normalizedName = name.trim().toLowerCase();

    const clientDistributor = await this.prisma.clientDistributor.findFirst({
      where: {
        distributorId: distributorId,
        client: {
          name: {
            contains: normalizedName,
            mode: "insensitive",
          },
        },
      },
      include: {
        client: true,
      },
    });

    if (!clientDistributor) return null;

    return {
      id: clientDistributor.client.id,
      name: clientDistributor.client.name,
      phone: clientDistributor.client.phone || undefined,
      address: clientDistributor.client.address || undefined,
      city: clientDistributor.client.city || undefined,
      postalCode: clientDistributor.client.postalCode || undefined,
    };
  }

  async findByPhoneForDistributor(
    distributorId: string,
    phone: string,
  ): Promise<Customer | null> {
    const clientDistributor = await this.prisma.clientDistributor.findFirst({
      where: {
        distributorId: distributorId,
        client: {
          phone: phone,
        },
      },
      include: {
        client: true,
      },
    });

    if (!clientDistributor) return null;

    return {
      id: clientDistributor.client.id,
      name: clientDistributor.client.name,
      phone: clientDistributor.client.phone || undefined,
      address: clientDistributor.client.address || undefined,
      city: clientDistributor.client.city || undefined,
      postalCode: clientDistributor.client.postalCode || undefined,
    };
  }

  async findByIdForDistributor(
    distributorId: string,
    clientId: string,
  ): Promise<Customer | null> {
    const clientDistributor = await this.prisma.clientDistributor.findFirst({
      where: {
        distributorId: distributorId,
        clientId: clientId,
      },
      include: {
        client: true,
      },
    });

    if (!clientDistributor) return null;

    return {
      id: clientDistributor.client.id,
      name: clientDistributor.client.name,
      phone: clientDistributor.client.phone || undefined,
      address: clientDistributor.client.address || undefined,
      city: clientDistributor.client.city || undefined,
      postalCode: clientDistributor.client.postalCode || undefined,
    };
  }

  async existsForDistributor(
    distributorId: string,
    name: string,
  ): Promise<boolean> {
    const customer = await this.findByNameForDistributor(distributorId, name);
    return customer !== null;
  }

  async searchForDistributor(
    distributorId: string,
    query: string,
  ): Promise<Customer[]> {
    if (!query.trim()) return [];

    const normalizedQuery = query.trim().toLowerCase();

    const clientDistributors = await this.prisma.clientDistributor.findMany({
      where: {
        distributorId: distributorId,
        client: {
          OR: [
            {
              name: {
                contains: normalizedQuery,
                mode: "insensitive",
              },
            },
            {
              phone: {
                contains: normalizedQuery,
                mode: "insensitive",
              },
            },
            {
              address: {
                contains: normalizedQuery,
                mode: "insensitive",
              },
            },
            {
              city: {
                contains: normalizedQuery,
                mode: "insensitive",
              },
            },
          ],
        },
      },
      include: {
        client: true,
      },
    });

    return clientDistributors.map((cd) => ({
      id: cd.client.id,
      name: cd.client.name,
      phone: cd.client.phone || undefined,
      address: cd.client.address || undefined,
      city: cd.client.city || undefined,
      postalCode: cd.client.postalCode || undefined,
    }));
  }
}

const prisma = new PrismaClient();
export const customerRepo = new PrismaCustomerRepository(prisma);
