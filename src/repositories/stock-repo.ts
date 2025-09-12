import { StockItem, normalize } from "@/domain/types";
import { store } from "@/repositories/memory/store";

export interface StockRepository {
  all(): StockItem[];
  search(query: string): StockItem[];
  getBySku(sku: string): StockItem | undefined;
  decrement(sku: string, qty: number): void;
}

export class MemoryStockRepository implements StockRepository {
  all(): StockItem[] {
    return store.stock;
  }
  search(query: string): StockItem[] {
    const terms = query
      .split(",")
      .map((t) => normalize(t.trim()))
      .filter(Boolean);
    if (terms.length === 0) return [];
    return store.stock.filter((p) =>
      terms.some(
        (term) =>
          normalize(p.sku).includes(term) || normalize(p.name).includes(term),
      ),
    );
  }
  getBySku(sku: string): StockItem | undefined {
    return store.stock.find((s) => s.sku === sku);
  }
  decrement(sku: string, qty: number): void {
    const s = this.getBySku(sku);
    if (s) s.qty = Math.max(0, s.qty - qty);
  }
}

export const stockRepo = new MemoryStockRepository();
