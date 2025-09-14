import { customerRepo } from "@/repositories/customer-repo";

export interface CustomerService {
  listForDistributor(distributorId: string): Promise<any[]>;
  findByNameForDistributor(distributorId: string, name: string): Promise<any | null>;
  findByIdForDistributor(distributorId: string, clientId: string): Promise<any | null>;
  existsForDistributor(distributorId: string, name: string): Promise<boolean>;
  searchForDistributor(distributorId: string, query: string): Promise<any[]>;
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
