import {
  customerRepo,
  CreateCustomerInput,
} from "@/repositories/customer.repository";
import { orderRepo, ClientOrderStats } from "@/repositories/order.repository";
import { Customer } from "@/domain/customer.dto";

export interface CustomerWithStats extends Customer {
  orderStats: ClientOrderStats;
}

export interface CustomerService {
  listForDistributor(distributorId: string): Promise<Customer[]>;
  listForDistributorWithStats(
    distributorId: string,
  ): Promise<CustomerWithStats[]>;
  findByNameForDistributor(
    distributorId: string,
    name: string,
  ): Promise<Customer | null>;
  findByIdForDistributor(
    distributorId: string,
    clientId: string,
  ): Promise<Customer | null>;
  findByIdForDistributorWithStats(
    distributorId: string,
    clientId: string,
  ): Promise<CustomerWithStats | null>;
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

class CustomerServiceImpl implements CustomerService {
  async listForDistributor(distributorId: string) {
    const customers = await customerRepo.listForDistributor(distributorId);
    return customers.map((customer) => ({ ...customer, distributorId }));
  }

  async listForDistributorWithStats(
    distributorId: string,
  ): Promise<CustomerWithStats[]> {
    const customers = await customerRepo.listForDistributor(distributorId);

    // Get order stats for all customers in parallel
    const customersWithStats = await Promise.all(
      customers.map(async (customer) => {
        const orderStats = await orderRepo.getClientOrderStats(
          distributorId,
          customer.id,
        );
        return {
          ...customer,
          distributorId,
          orderStats,
        };
      }),
    );

    return customersWithStats;
  }

  async findByNameForDistributor(distributorId: string, name: string) {
    const customer = await customerRepo.findByNameForDistributor(
      distributorId,
      name,
    );
    return customer ? { ...customer, distributorId } : null;
  }

  async findByIdForDistributor(distributorId: string, clientId: string) {
    const customer = await customerRepo.findByIdForDistributor(
      distributorId,
      clientId,
    );
    return customer ? { ...customer, distributorId } : null;
  }

  async findByIdForDistributorWithStats(
    distributorId: string,
    clientId: string,
  ): Promise<CustomerWithStats | null> {
    const customer = await customerRepo.findByIdForDistributor(
      distributorId,
      clientId,
    );

    if (!customer) {
      return null;
    }

    const orderStats = await orderRepo.getClientOrderStats(
      distributorId,
      clientId,
    );

    return {
      ...customer,
      distributorId,
      orderStats,
    };
  }

  async existsForDistributor(distributorId: string, name: string) {
    return customerRepo.existsForDistributor(distributorId, name);
  }

  async searchForDistributor(distributorId: string, query: string) {
    const customers = await customerRepo.searchForDistributor(
      distributorId,
      query,
    );
    return customers.map((customer) => ({ ...customer, distributorId }));
  }

  async createForDistributor(distributorId: string, data: CreateCustomerInput) {
    const customer = await customerRepo.createForDistributor(
      distributorId,
      data,
    );
    return { ...customer, distributorId };
  }
}

export const customerService = new CustomerServiceImpl();
