import { orderRepo } from "@/repositories/order.repository";
import { stockRepo } from "@/repositories/stock.repository";
import { userRepo } from "@/repositories/user.repository";
import { OrderWithItems } from "@/repositories/order.repository";

export interface OrderService {
  createOrderForSalesperson(
    salespersonId: string,
    distributorId: string,
    clientId: string,
    items: { sku: string; quantity: number }[],
    deliveryAddress?: string,
    notes?: string,
  ): Promise<OrderWithItems>;
  confirmOrder(orderId: string): Promise<OrderWithItems | null>;
  getOrderById(orderId: string): Promise<OrderWithItems | null>;
  getOrderByNumber(orderNumber: string): Promise<OrderWithItems | null>;
  getAllOrdersByDistributor(distributorId: string): Promise<OrderWithItems[]>;
  getOrdersByDistributorAndStatus(
    distributorId: string,
    status: string,
  ): Promise<OrderWithItems[]>;
  updateOrderStatus(
    orderId: string,
    status: string,
  ): Promise<OrderWithItems | null>;
  bulkUpdateOrderStatus(orderIds: string[], status: string): Promise<void>;
}

class OrderServiceImpl implements OrderService {
  async createOrderForSalesperson(
    salespersonId: string,
    distributorId: string,
    clientId: string,
    items: { sku: string; quantity: number }[],
    deliveryAddress?: string,
    notes?: string,
  ) {
    if (!distributorId) {
      throw new Error(
        `No se encontró distribuidora para el vendedor ${salespersonId}`,
      );
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

  async getAllOrdersByDistributor(distributorId: string) {
    return orderRepo.findAllByDistributor(distributorId);
  }

  async getOrdersByDistributorAndStatus(distributorId: string, status: string) {
    return orderRepo.findByDistributorAndStatus(distributorId, status);
  }

  async updateOrderStatus(orderId: string, status: string) {
    return orderRepo.updateOrderStatus(orderId, status);
  }

  async bulkUpdateOrderStatus(orderIds: string[], status: string) {
    // Actualizar múltiples pedidos de una vez
    await Promise.all(
      orderIds.map((orderId) => orderRepo.updateOrderStatus(orderId, status)),
    );
  }
}

export const orderService = new OrderServiceImpl();
