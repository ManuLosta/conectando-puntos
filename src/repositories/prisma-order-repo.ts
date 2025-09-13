import { PrismaClient } from '@prisma/client';

export interface OrderItemInput {
  productId: string;
  sku: string;
  quantity: number;
  price: number;
}

export interface CreateOrderInput {
  clientId: string;
  salespersonId: string;
  items: OrderItemInput[];
  deliveryAddress?: string;
  notes?: string;
}

export interface OrderWithItems {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  clientId: string | null;
  salespersonId: string | null;
  deliveryAddress: string | null;
  notes: string | null;
  createdAt: Date;
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

export interface PrismaOrderRepository {
  createOrder(orderData: CreateOrderInput): Promise<OrderWithItems>;
  findById(id: string): Promise<OrderWithItems | null>;
  findByOrderNumber(orderNumber: string): Promise<OrderWithItems | null>;
}

export class PrismaOrderRepositoryImpl implements PrismaOrderRepository {
  constructor(private prisma: PrismaClient) {}

  private generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  async createOrder(orderData: CreateOrderInput): Promise<OrderWithItems> {
    const orderNumber = this.generateOrderNumber();
    const total = orderData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        clientId: orderData.clientId,
        salespersonId: orderData.salespersonId,
        total,
        deliveryAddress: orderData.deliveryAddress,
        notes: orderData.notes,
        items: {
          create: orderData.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
            subtotal: item.price * item.quantity
          }))
        }
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true
              }
            }
          }
        }
      }
    });

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      clientId: order.clientId,
      salespersonId: order.salespersonId,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        product: {
          name: item.product.name,
          sku: item.product.sku
        }
      }))
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
                sku: true
              }
            }
          }
        }
      }
    });

    if (!order) return null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      clientId: order.clientId,
      salespersonId: order.salespersonId,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        product: {
          name: item.product.name,
          sku: item.product.sku
        }
      }))
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
                sku: true
              }
            }
          }
        }
      }
    });

    if (!order) return null;

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      total: Number(order.total),
      clientId: order.clientId,
      salespersonId: order.salespersonId,
      deliveryAddress: order.deliveryAddress,
      notes: order.notes,
      createdAt: order.createdAt,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(item.price),
        subtotal: Number(item.subtotal),
        product: {
          name: item.product.name,
          sku: item.product.sku
        }
      }))
    };
  }
}

const prisma = new PrismaClient();
export const prismaOrderRepo = new PrismaOrderRepositoryImpl(prisma);