import { stockRepo, StockItem } from "@/repositories/stock-repo";
import { customerService } from "@/services/customer";

type Suggestion = {
  sku: string;
  name: string;
  reason: "expiring_soon" | "repeat_purchase";
  suggestedQty: number;
  price: number;
  qtyAvailable: number;
  expiryDays?: number;
};

export const suggestionService = {
  async suggestProducts(
    distributorId: string,
    clientId: string,
    topN = 5,
  ): Promise<Suggestion[]> {
    const customer = await customerService.findByIdForDistributor(
      distributorId,
      clientId,
    );
    if (!customer) {
      throw new Error(`Cliente no encontrado: ${clientId}`);
    }

    // Get stock and orders for the distributor
    const stock = await stockRepo.getAllForDistributor(distributorId);

    // For now, we'll create a simple mock for expiring products since the StockItem doesn't have expiryDays
    // In a real implementation, you'd extend the StockItem interface or query a different source
    const expiring: Suggestion[] = stock
      .filter((s: StockItem) => s.stock > 0)
      .slice(0, Math.floor(topN / 2)) // Take half for expiring
      .map((s: StockItem) => ({
        sku: s.sku,
        name: s.name,
        reason: "expiring_soon" as const,
        suggestedQty: Math.min(10, Math.max(1, Math.floor(s.stock * 0.1))),
        price: s.price,
        qtyAvailable: s.stock,
        expiryDays: 15, // Mock expiry days - replace with real logic
      }));

    // For repeat purchases, we'd need to implement order history by customer
    // This is a simplified version since the current order structure may not have customer names
    const topRepeat: Suggestion[] = stock
      .slice(Math.floor(topN / 2)) // Take the other half
      .filter((s: StockItem) => s.stock > 0)
      .slice(0, topN - expiring.length)
      .map((s: StockItem) => ({
        sku: s.sku,
        name: s.name,
        reason: "repeat_purchase" as const,
        suggestedQty: Math.min(10, Math.max(1, Math.floor(s.stock * 0.05))),
        price: s.price,
        qtyAvailable: s.stock,
      }));

    const merged: Suggestion[] = [];
    const seen = new Set<string>();
    [...expiring, ...topRepeat].forEach((s: Suggestion) => {
      if (seen.has(s.sku)) return;
      seen.add(s.sku);
      merged.push(s);
    });
    return merged.slice(0, topN);
  },
};
