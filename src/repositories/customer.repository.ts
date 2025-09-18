import { PrismaClient, Client } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  clientType?: string;
  notes?: string;
  assignedSalespersonId?: string;
}

export interface CreateCustomerInput {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  postalCode?: string;
  clientType?: string;
  notes?: string;
  assignedSalespersonId?: string;
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
  createForDistributor(
    distributorId: string,
    data: CreateCustomerInput,
  ): Promise<Customer>;
}

export class PrismaCustomerRepository implements CustomerRepository {
  constructor(private prisma: PrismaClient) {}

  async listForDistributor(distributorId: string): Promise<Customer[]> {
    const clients = await this.prisma.client.findMany({
      where: { distributorId },
    });

    return clients.map((c: Client) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || undefined,
      email: c.email || undefined,
      address: c.address || undefined,
      city: c.city || undefined,
      postalCode: c.postalCode || undefined,
      clientType: c.clientType || undefined,
      notes: c.notes || undefined,
      assignedSalespersonId: c.assignedSalespersonId || undefined,
    }));
  }

  async findByNameForDistributor(
    distributorId: string,
    name: string,
  ): Promise<Customer | null> {
    const normalizedName = name.trim().toLowerCase();

    const client = await this.prisma.client.findFirst({
      where: {
        distributorId: distributorId,
        name: {
          contains: normalizedName,
          mode: "insensitive",
        },
      },
    });

    if (!client) return null;

    return {
      id: client.id,
      name: client.name,
      phone: client.phone || undefined,
      email: client.email || undefined,
      address: client.address || undefined,
      city: client.city || undefined,
      postalCode: client.postalCode || undefined,
      clientType: client.clientType || undefined,
      notes: client.notes || undefined,
      assignedSalespersonId: client.assignedSalespersonId || undefined,
    };
  }

  async findByPhoneForDistributor(
    distributorId: string,
    phone: string,
  ): Promise<Customer | null> {
    const client = await this.prisma.client.findFirst({
      where: {
        distributorId: distributorId,
        phone: phone,
      },
    });

    if (!client) return null;

    return {
      id: client.id,
      name: client.name,
      phone: client.phone || undefined,
      email: client.email || undefined,
      address: client.address || undefined,
      city: client.city || undefined,
      postalCode: client.postalCode || undefined,
      clientType: client.clientType || undefined,
      notes: client.notes || undefined,
      assignedSalespersonId: client.assignedSalespersonId || undefined,
    };
  }

  async findByIdForDistributor(
    distributorId: string,
    clientId: string,
  ): Promise<Customer | null> {
    const client = await this.prisma.client.findFirst({
      where: {
        distributorId: distributorId,
        id: clientId,
      },
    });

    if (!client) return null;

    return {
      id: client.id,
      name: client.name,
      phone: client.phone || undefined,
      email: client.email || undefined,
      address: client.address || undefined,
      city: client.city || undefined,
      postalCode: client.postalCode || undefined,
      clientType: client.clientType || undefined,
      notes: client.notes || undefined,
      assignedSalespersonId: client.assignedSalespersonId || undefined,
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

    const clients = await this.prisma.client.findMany({
      where: {
        distributorId: distributorId,
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
    });

    return clients.map((c: Client) => ({
      id: c.id,
      name: c.name,
      phone: c.phone || undefined,
      email: c.email || undefined,
      address: c.address || undefined,
      city: c.city || undefined,
      postalCode: c.postalCode || undefined,
      clientType: c.clientType || undefined,
      notes: c.notes || undefined,
      assignedSalespersonId: c.assignedSalespersonId || undefined,
    }));
  }

  async createForDistributor(
    distributorId: string,
    data: CreateCustomerInput,
  ): Promise<Customer> {
    const client = await this.prisma.client.create({
      data: {
        distributorId,
        name: data.name,
        phone: data.phone || null,
        email: data.email || null,
        address: data.address || null,
        city: data.city || null,
        postalCode: data.postalCode || null,
        clientType: data.clientType || null,
        notes: data.notes || null,
        assignedSalespersonId: data.assignedSalespersonId || null,
      },
    });

    return {
      id: client.id,
      name: client.name,
      phone: client.phone || undefined,
      email: client.email || undefined,
      address: client.address || undefined,
      city: client.city || undefined,
      postalCode: client.postalCode || undefined,
      clientType: client.clientType || undefined,
      notes: client.notes || undefined,
      assignedSalespersonId: client.assignedSalespersonId || undefined,
    };
  }
}

export const customerRepo = new PrismaCustomerRepository(prisma);
