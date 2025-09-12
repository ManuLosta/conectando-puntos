import { Customer, normalize } from "@/domain/types";
import { store } from "@/repositories/memory/store";

export interface CustomerRepository {
  list(): Customer[];
  findByName(name: string): Customer | undefined;
  exists(name: string): boolean;
}

export class MemoryCustomerRepository implements CustomerRepository {
  list(): Customer[] {
    return [...store.customers];
  }
  findByName(name: string): Customer | undefined {
    const n = normalize(name.trim());
    return store.customers.find(
      (c) =>
        normalize(c.name) === n ||
        normalize(c.name).includes(n) ||
        n.includes(normalize(c.name)),
    );
  }
  exists(name: string): boolean {
    return Boolean(this.findByName(name));
  }
}

export const customerRepo = new MemoryCustomerRepository();
