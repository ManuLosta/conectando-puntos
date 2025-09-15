// This file is replaced by prisma-order-repo.ts
// Re-export the new implementation for backward compatibility
export {
  prismaOrderRepo as orderRepo,
  type PrismaOrderRepository as OrderRepository,
  type OrderWithItems as Order,
  type CreateOrderInput,
  type OrderItemInput as OrderItem,
} from "./prisma-order-repo";
