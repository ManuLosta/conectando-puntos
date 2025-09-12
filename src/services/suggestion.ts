import { orderRepo } from "@/repositories/order-repo";
import { stockRepo } from "@/repositories/stock-repo";
import { customerService } from "@/services/customer";

export const suggestionService = {
  suggestProducts(customer: string, topN = 5) {
    if (!customerService.exists(customer)) {
      throw new Error(`Cliente no encontrado: ${customer}`);
    }
    type Suggestion = {
      sku: string;
      name: string;
      reason: "expiring_soon" | "repeat_purchase";
      suggestedQty: number;
      price: number;
      qtyAvailable: number;
      expiryDays?: number;
    };

    const stock = stockRepo.all();
    const orders = orderRepo.all();

    // Expiring soon (<= 30 days)
    const expiring: Suggestion[] = stock
      .filter((s) => (s.expiryDays ?? 9999) <= 30 && s.qty > 0)
      .slice(0, topN)
      .map((s) => ({
        sku: s.sku,
        name: s.name,
        reason: "expiring_soon" as const,
        suggestedQty: Math.min(10, Math.max(1, Math.floor(s.qty * 0.1))),
        price: s.price,
        qtyAvailable: s.qty,
        expiryDays: s.expiryDays,
      }));

    // Repeat purchases
    const past = orders.filter((o) => o.customer === customer);
    const freq = new Map<string, number>();
    past.forEach((o) =>
      o.items.forEach((it) =>
        freq.set(it.sku, (freq.get(it.sku) ?? 0) + it.qty),
      ),
    );
    const topRepeat: Suggestion[] = Array.from(freq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([sku, qty]) => {
        const s = stock.find((x) => x.sku === sku);
        return s
          ? {
              sku: s.sku,
              name: s.name,
              reason: "repeat_purchase" as const,
              suggestedQty: Math.min(
                10,
                Math.max(1, Math.round(qty / past.length || 1)),
              ),
              price: s.price,
              qtyAvailable: s.qty,
              expiryDays: s.expiryDays,
            }
          : undefined;
      })
      .filter((v): v is Suggestion => Boolean(v));

    const merged: Suggestion[] = [];
    const seen = new Set<string>();
    [...expiring, ...topRepeat].forEach((s) => {
      if (seen.has(s.sku)) return;
      seen.add(s.sku);
      merged.push(s);
    });
    return merged.slice(0, topN);
  },
};
