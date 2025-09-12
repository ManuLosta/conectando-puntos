import { customerRepo } from "@/repositories/customer-repo";

export const customerService = {
  list() {
    return customerRepo.list();
  },
  findByName(name: string) {
    return customerRepo.findByName(name);
  },
  exists(name: string) {
    return customerRepo.exists(name);
  },
};
