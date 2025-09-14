import { customerRepo } from "@/repositories/customer-repo";
import { Customer } from "@/domain/types";

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
    return customerRepo.listForDistributor(distributorId);
  }

  async findByNameForDistributor(distributorId: string, name: string) {
    return customerRepo.findByNameForDistributor(distributorId, name);
  }

  async findByIdForDistributor(distributorId: string, clientId: string) {
    return customerRepo.findByIdForDistributor(distributorId, clientId);
  }

  async existsForDistributor(distributorId: string, name: string) {
    return customerRepo.existsForDistributor(distributorId, name);
  }

  async searchForDistributor(distributorId: string, query: string) {
    return customerRepo.searchForDistributor(distributorId, query);
  }
}

export const customerService = new CustomerServiceImpl();
