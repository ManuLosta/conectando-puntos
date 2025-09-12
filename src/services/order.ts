import { catalogService } from "@/services/catalog";
import { orderRepo } from "@/repositories/order-repo";
import { customerService } from "@/services/customer";
import { Order } from "@/domain/types";
import { stockRepo } from "@/repositories/stock-repo";

export const orderService = {
  createDraftOrder(
    customer: string,
    items: { sku: string; qty: number }[],
  ): Order {
    if (!customerService.exists(customer)) {
      throw new Error(`Cliente no encontrado: ${customer}`);
    }
    const orderItems = items.map((it) => {
      const prod = catalogService.getBySku(it.sku);
      const price = prod?.price ?? 0;
      const name = prod?.name ?? it.sku;
      const lineTotal = price * it.qty;
      return { sku: it.sku, name, qty: it.qty, price, lineTotal };
    });
    return orderRepo.createDraft(customer, orderItems);
  },
  confirmOrder(orderId: string): Order | undefined {
    const order = orderRepo.confirm(orderId);
    if (!order) return undefined;
    // decrement stock on confirm
    order.items.forEach((it) => {
      const s = catalogService.getBySku(it.sku);
      if (s) {
        stockRepo.decrement(it.sku, it.qty);
      }
    });
    return order;
  },
};
