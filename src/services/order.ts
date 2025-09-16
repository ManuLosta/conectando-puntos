import { orderRepo } from "@/repositories/order-repo";
import { customerService } from "@/services/customer";
import { stockRepo } from "@/repositories/stock-repo";
import { userRepo } from "@/repositories/user-repo";
import { OrderWithItems } from "@/repositories/prisma-order-repo";

export interface OrderService {
  createOrderForSalesperson(
    salespersonId: string,
    clientId: string,
    items: { sku: string; quantity: number }[],
    deliveryAddress?: string,
    notes?: string,
  ): Promise<OrderWithItems>;
  confirmOrder(orderId: string): Promise<OrderWithItems | null>;
  getOrderById(orderId: string): Promise<OrderWithItems | null>;
  getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null>;
}

class OrderServiceImpl implements OrderService {
  async createOrderForSalesperson(
    salespersonId: string,
    clientId: string,
    items: { sku: string; quantity: number }[],
    deliveryAddress?: string,
    notes?: string,
  ) {
    const distributorId =
      await userRepo.getSalespersonDistributor(salespersonId);
    if (!distributorId) {
      throw new Error(
        `No se encontró distribuidora para el vendedor ${salespersonId}`,
      );
    }

    const customer = await customerService.findByIdForDistributor(
      distributorId,
      clientId,
    );
    if (!customer) {
      throw new Error(`Cliente no encontrado: ${clientId}`);
    }

    const orderItems = await Promise.all(
      items.map(async (item) => {
        const product = await stockRepo.getBySkuForDistributor(
          distributorId,
          item.sku,
        );
        if (!product) {
          throw new Error(`Producto no encontrado: ${item.sku}`);
        }
        if (product.stock < item.quantity) {
          throw new Error(
            `Stock insuficiente para ${item.sku}. Disponible: ${product.stock}, solicitado: ${item.quantity}`,
          );
        }

        return {
          productId: product.id,
          sku: product.sku,
          quantity: item.quantity,
          price: product.price,
        };
      }),
    );

    const orderData = {
      clientId,
      salespersonId,
      distributorId,
      items: orderItems,
      deliveryAddress,
      notes,
    };

    return orderRepo.createOrder(orderData);
  }

  async confirmOrder(orderId: string) {
    const order = await orderRepo.findById(orderId);
    if (!order) return null;

    const distributorId = await userRepo.getSalespersonDistributor(
      order.salespersonId!,
    );
    if (!distributorId) {
      throw new Error(
        `No se encontró distribuidora para el vendedor ${order.salespersonId}`,
      );
    }

    for (const item of order.items) {
      await stockRepo.decrementStock(
        distributorId,
        item.product.sku,
        item.quantity,
      );
    }

    return order;
  }

  async getOrderById(orderId: string) {
    return orderRepo.findById(orderId);
  }

  async getOrderByNumber(orderNumber: string) {
    return orderRepo.findByOrderNumber(orderNumber);
  }
}

export const orderService = new OrderServiceImpl();
