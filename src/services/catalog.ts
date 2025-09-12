import { stockRepo } from "@/repositories/stock-repo";

export const catalogService = {
  searchStock(query: string) {
    return stockRepo.search(query);
  },
  getBySku(sku: string) {
    return stockRepo.getBySku(sku);
  },
};
