import { PrismaClient } from '@prisma/client';

export interface Customer {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  isActive: boolean;
}

export interface CustomerRepository {
  listForDistributor(distributorId: string): Promise<Customer[]>;
  findByNameForDistributor(distributorId: string, name: string): Promise<Customer | null>;
  findByIdForDistributor(distributorId: string, clientId: string): Promise<Customer | null>;
  existsForDistributor(distributorId: string, name: string): Promise<boolean>;
  searchForDistributor(distributorId: string, query: string): Promise<Customer[]>;
}

export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private prisma: PrismaClient) {}

  async listForDistributor(distributorId: string): Promise<Customer[]> {
    const clientDistributors = await this.prisma.clientDistributor.findMany({
      where: {
        distributorId: distributorId
      },
      include: {
        client: {
          include: {
            user: true
          }
        }
      }
    });

    return clientDistributors.map(cd => ({
      id: cd.client.id,
      name: cd.client.user.name,
      email: cd.client.user.email,
      phone: cd.client.user.phone || undefined,
      address: cd.client.address || undefined,
      city: cd.client.city || undefined,
      isActive: cd.client.user.isActive
    }));
  }

  async findByNameForDistributor(distributorId: string, name: string): Promise<Customer | null> {
    const normalizedName = name.trim().toLowerCase();

    const clientDistributor = await this.prisma.clientDistributor.findFirst({
      where: {
        distributorId: distributorId,
        client: {
          user: {
            name: {
              contains: normalizedName,
              mode: 'insensitive'
            },
            isActive: true
          }
        }
      },
      include: {
        client: {
          include: {
            user: true
          }
        }
      }
    });

    if (!clientDistributor) return null;

    return {
      id: clientDistributor.client.id,
      name: clientDistributor.client.user.name,
      email: clientDistributor.client.user.email,
      phone: clientDistributor.client.user.phone || undefined,
      address: clientDistributor.client.address || undefined,
      city: clientDistributor.client.city || undefined,
      isActive: clientDistributor.client.user.isActive
    };
  }

  async findByIdForDistributor(distributorId: string, clientId: string): Promise<Customer | null> {
    const clientDistributor = await this.prisma.clientDistributor.findFirst({
      where: {
        distributorId: distributorId,
        clientId: clientId
      },
      include: {
        client: {
          include: {
            user: true
          }
        }
      }
    });

    if (!clientDistributor) return null;

    return {
      id: clientDistributor.client.id,
      name: clientDistributor.client.user.name,
      email: clientDistributor.client.user.email,
      phone: clientDistributor.client.user.phone || undefined,
      address: clientDistributor.client.address || undefined,
      city: clientDistributor.client.city || undefined,
      isActive: clientDistributor.client.user.isActive
    };
  }

  async existsForDistributor(distributorId: string, name: string): Promise<boolean> {
    const customer = await this.findByNameForDistributor(distributorId, name);
    return customer !== null;
  }

  async searchForDistributor(distributorId: string, query: string): Promise<Customer[]> {
    if (!query.trim()) return [];

    const normalizedQuery = query.trim().toLowerCase();

    const clientDistributors = await this.prisma.clientDistributor.findMany({
      where: {
        distributorId: distributorId,
        client: {
          user: {
            OR: [
              {
                name: {
                  contains: normalizedQuery,
                  mode: 'insensitive'
                }
              },
              {
                email: {
                  contains: normalizedQuery,
                  mode: 'insensitive'
                }
              }
            ],
            isActive: true
          }
        }
      },
      include: {
        client: {
          include: {
            user: true
          }
        }
      }
    });

    return clientDistributors.map(cd => ({
      id: cd.client.id,
      name: cd.client.user.name,
      email: cd.client.user.email,
      phone: cd.client.user.phone || undefined,
      address: cd.client.address || undefined,
      city: cd.client.city || undefined,
      isActive: cd.client.user.isActive
    }));
  }
}

const prisma = new PrismaClient();
export const customerRepo = new PrismaCustomerRepository(prisma);