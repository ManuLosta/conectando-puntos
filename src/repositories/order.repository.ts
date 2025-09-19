import { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PREPARATION"
  | "DELIVERED"
  | "CANCELLED";

export interface OrderItemInput {
  productId: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface CreateOrderInput {
  distributorId: string;
  clientId: string;
  salespersonId: string | null;
  items: OrderItemInput[];
  deliveryAddress?: string;
  notes?: string;
}

export interface OrderWithItems {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  distributorId: string;
  clientId: string | null;
  salespersonId: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  createdAt: Date;
  client?: {
    id: string;
    name: string;
  } | null;
  salesperson?: {
    id: string;
    phone?: string | null;
  } | null;
  items: Array<{
    id: string;
    productId: string;
    quantity: number;
    price: number;
    subtotal: number;
    product: {
      name: string;
      sku: string;
    };
  }>;
}

export interface ClientOrderStats {
  totalOrders: number;
  totalAmount: number;
  monthlyAmount: number;
  lastOrderDate: Date | null;
  recentOrders: OrderWithItems[];
}

export interface OrderRepository {
  createOrder(orderData: CreateOrderInput): Promise<OrderWithItems>;
  findById(id: string): Promise<OrderWithItems | null>;
  findByOrderNumber(orderNumber: string): Promise<OrderWithItems | null>;
  findAllByDistributor(distributorId: string): Promise<OrderWithItems[]>;
  findByDistributorAndStatus(
    distributorId: string,
    status: string,
  ): Promise<OrderWithItems[]>;
  updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderWithItems | null>;
  bulkUpdateOrderStatus(
    orderIds: string[],
    status: OrderStatus,
  ): Promise<{ success: boolean; count: number }>;
  getClientOrderStats(
    distributorId: string,
    clientId: string,
  ): Promise<ClientOrderStats>;
  getClientOrders(
    distributorId: string,
    clientId: string,
    limit?: number,
  ): Promise<OrderWithItems[]>;
}

export class OrderRepositoryImpl implements OrderRepository {
  constructor(private prisma: PrismaClient) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");
    return `ORD-${timestamp}-${random}`;
  }

  async createOrder(orderData: CreateOrderInput): Promise<OrderWithItems> {
    const orderNumber = this.generateOrderNumber();
    const total = orderData.items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );

    const order = await this.prisma.order.create({
      data: {
        distributorId: orderData.distributorId,
        orderNumber,
        clientId: orderData.clientId,
        salespersonId: orderData.salespersonId,
        total,
        deliveryAddress: orderData.deliveryAddress,
        notes: orderData.notes,
        items: {
          create: orderData.items.map((item) => ({
            distributorId: orderData.distributorId,
            product: { connect: { id: item.productId } },
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    return {
      id: order.id,
      distributorId: order.distributorId,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      clientId: order.clientId,
      salespersonId: order.salespersonId,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      items: order.items?.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        product: {
          name: item.product.name,
          sku: item.product.sku,
        },
      })),
    };
  }

  async findById(id: string): Promise<OrderWithItems | null> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!order) return null;

    return {
      id: order.id,
      distributorId: order.distributorId,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      clientId: order.clientId,
      salespersonId: order.salespersonId,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      items: order.items?.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        product: {
          name: item.product.name,
          sku: item.product.sku,
        },
      })),
    };
  }

  async findByOrderNumber(orderNumber: string): Promise<OrderWithItems | null> {
    const order = await this.prisma.order.findUnique({
      where: { orderNumber },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    if (!order) return null;

    return {
      id: order.id,
      distributorId: order.distributorId,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      clientId: order.clientId,
      salespersonId: order.salespersonId,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      items: order.items?.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        product: {
          name: item.product.name,
          sku: item.product.sku,
        },
      })),
    };
  }

  async findAllByDistributor(distributorId: string): Promise<OrderWithItems[]> {
    const orders = await this.prisma.order.findMany({
      where: { distributorId },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        salesperson: {
          select: {
            id: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders.map((order) => ({
      id: order.id,
      distributorId: order.distributorId,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      clientId: order.clientId,
      salespersonId: order.salespersonId,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      client: order.client,
      salesperson: order.salesperson,
      items: order.items?.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        product: {
          name: item.product.name,
          sku: item.product.sku,
        },
      })),
    }));
  }

  async findByDistributorAndStatus(
    distributorId: string,
    status: string,
  ): Promise<OrderWithItems[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        distributorId,
        status: status as OrderStatus,
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        salesperson: {
          select: {
            id: true,
            phone: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return orders.map((order) => ({
      id: order.id,
      distributorId: order.distributorId,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      clientId: order.clientId,
      salespersonId: order.salespersonId,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      client: order.client,
      salesperson: order.salesperson,
      items: order.items?.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        product: {
          name: item.product.name,
          sku: item.product.sku,
        },
      })),
    }));
  }

  async updateOrderStatus(
    orderId: string,
    status: OrderStatus,
  ): Promise<OrderWithItems | null> {
    try {
      const order = await this.prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          client: {
            select: {
              id: true,
              name: true,
            },
          },
          salesperson: {
            select: {
              id: true,
              phone: true,
            },
          },
          items: {
            include: {
              product: {
                select: {
                  name: true,
                  sku: true,
                },
              },
            },
          },
        },
      });

      return {
        id: order.id,
        distributorId: order.distributorId,
        orderNumber: order.orderNumber,
        status: order.status,
        total: Number(order.total),
        clientId: order.clientId,
        salespersonId: order.salespersonId,
        deliveryAddress: order.deliveryAddress,
        notes: order.notes,
        createdAt: order.createdAt,
        client: order.client,
        salesperson: order.salesperson,
        items: order.items?.map((item) => ({
          id: item.id,
          productId: item.productId,
          quantity: item.quantity,
          price: Number(item.price),
          subtotal: Number(item.subtotal),
          product: {
            name: item.product.name,
            sku: item.product.sku,
          },
        })),
      };
    } catch (error) {
      console.error("Error updating order status:", error);
      return null;
    }
  }

  async bulkUpdateOrderStatus(
    orderIds: string[],
    status: OrderStatus,
  ): Promise<{ success: boolean; count: number }> {
    try {
      const result = await this.prisma.order.updateMany({
        where: {
          id: {
            in: orderIds,
          },
        },
        data: { status },
      });

      return { success: true, count: result.count };
    } catch (error) {
      console.error("Error in bulk update:", error);
      return { success: false, count: 0 };
    }
  }

  async getClientOrderStats(
    distributorId: string,
    clientId: string,
  ): Promise<ClientOrderStats> {
    // Get current month start date
    const now = new Date();
    const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get all orders for the client
    const orders = await this.prisma.order.findMany({
      where: {
        distributorId,
        clientId,
      },
      select: {
        id: true,
        total: true,
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate stats
    const totalOrders = orders.length;
    const totalAmount = orders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );

    // Calculate monthly amount (current month)
    const monthlyOrders = orders.filter(
      (order) => order.createdAt >= currentMonthStart,
    );
    const monthlyAmount = monthlyOrders.reduce(
      (sum, order) => sum + Number(order.total),
      0,
    );

    // Get last order date
    const lastOrderDate = orders.length > 0 ? orders[0].createdAt : null;

    // Get recent orders (last 5) with full details
    const recentOrders = await this.getClientOrders(distributorId, clientId, 5);

    return {
      totalOrders,
      totalAmount,
      monthlyAmount,
      lastOrderDate,
      recentOrders,
    };
  }

  async getClientOrders(
    distributorId: string,
    clientId: string,
    limit?: number,
  ): Promise<OrderWithItems[]> {
    const orders = await this.prisma.order.findMany({
      where: {
        distributorId,
        clientId,
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      ...(limit && { take: limit }),
    });

    return orders.map((order) => ({
      id: order.id,
      distributorId: order.distributorId,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      clientId: order.clientId,
      salespersonId: order.salespersonId,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      items: order.items?.map((item) => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        product: {
          name: item.product.name,
          sku: item.product.sku,
        },
      })),
    }));
  }
}

export const orderRepo = new OrderRepositoryImpl(prisma);

// Export types with cleaner names
export type Order = OrderWithItems;
export type OrderItem = OrderItemInput;
