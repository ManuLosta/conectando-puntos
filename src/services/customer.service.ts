import { customerRepo } from "@/repositories/customer.repository";
import { Customer } from "@/domain/customer.dto";

export interface CustomerService {
  listForDistributor(distributorId: string): Promise<Customer[]>;
  findByNameForDistributor(
    distributorId: string,
    name: string,
  ): Promise<Customer | null>;
  findByIdForDistributor(
    distributorId: string,
    clientId: string,
  ): Promise<Customer | null>;
  existsForDistributor(distributorId: string, name: string): Promise<boolean>;
  searchForDistributor(
    distributorId: string,
    query: string,
  ): Promise<Customer[]>;
}

class CustomerServiceImpl implements CustomerService {
  async listForDistributor(distributorId: string) {
    const customers = await customerRepo.listForDistributor(distributorId);
    return customers.map((customer) => ({ ...customer, distributorId }));
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
}

export const customerService = new CustomerServiceImpl();
