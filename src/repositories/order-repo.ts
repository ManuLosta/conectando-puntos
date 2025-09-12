import { Order, OrderItem } from "@/domain/types";
import { makeOrderId, store } from "@/repositories/memory/store";

export interface OrderRepository {
  all(): Order[];
  createDraft(customer: string, items: OrderItem[]): Order;
  findById(id: string): Order | undefined;
  confirm(id: string): Order | undefined;
}

export class MemoryOrderRepository implements OrderRepository {
  all(): Order[] {
    return store.orders;
  }
  createDraft(customer: string, items: OrderItem[]): Order {
    const total = items.reduce((acc, it) => acc + it.lineTotal, 0);
    const order: Order = {
      orderId: makeOrderId(),
      customer,
      status: "DRAFT",
      items,
      total,
      createdAt: new Date().toISOString(),
    };
    store.orders.push(order);
    return order;
  }
  findById(id: string): Order | undefined {
    return store.orders.find((o) => o.orderId === id);
  }
  confirm(id: string): Order | undefined {
    const order = this.findById(id);
    if (!order) return undefined;
    order.status = "CONFIRMED";
    order.confirmedAt = new Date().toISOString();
    return order;
  }
}

export const orderRepo = new MemoryOrderRepository();
