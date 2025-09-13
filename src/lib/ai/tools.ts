import { z } from "zod";
import { tool } from "ai";
import { catalogService } from "@/services/catalog";
import { orderService } from "@/services/order";
import { customerService } from "@/services/customer";
import { stockRepo } from "@/repositories/stock-repo";
import { userRepo } from "@/repositories/user-repo";

async function getDistributorFromContext(phone: string): Promise<string> {
  const distributorId = await userRepo.getSalespersonDistributorByPhone(phone);
  if (!distributorId) {
    throw new Error(`No se encontró distribuidora para el vendedor con teléfono ${phone}`);
  }
  return distributorId;
}

export const consultarCatalogo = tool({
  description: "Consulta el catálogo completo de productos disponibles para la distribuidora del vendedor.",
  inputSchema: z.object({
    phone: z.string().describe("Número de teléfono del vendedor que realiza la consulta")
  }),
  execute: async ({ phone }) => {
    const distributorId = await getDistributorFromContext(phone);
    return catalogService.getCatalogForDistributor(distributorId);
  },
});

export const buscarProductos = tool({
  description: "Busca productos por prefijo de nombre o SKU en el catálogo de la distribuidora.",
  inputSchema: z.object({
    phone: z.string().describe("Número de teléfono del vendedor que realiza la búsqueda"),
    prefix: z.string().describe("Prefijo para buscar productos por nombre o SKU")
  }),
  execute: async ({ phone, prefix }) => {
    const distributorId = await getDistributorFromContext(phone);
    return catalogService.searchProductsByPrefix(distributorId, prefix);
  },
});

export const consultarStock = tool({
  description: "Consulta stock de productos por búsqueda de texto o SKU. Puede buscar múltiples productos separados por comas.",
  inputSchema: z.object({
    phone: z.string().describe("Número de teléfono del vendedor que realiza la consulta"),
    query: z.string().describe("Texto de búsqueda para productos")
  }),
  execute: async ({ phone, query }) => {
    const distributorId = await getDistributorFromContext(phone);
    return stockRepo.searchForDistributor(distributorId, query);
  },
});

export const crearOrden = tool({
  description: "Crea una orden completa para un cliente específico con validación de stock.",
  inputSchema: z.object({
    phone: z.string().describe("Número de teléfono del vendedor que crea la orden"),
    clientId: z.string().describe("ID del cliente para quien se crea la orden"),
    items: z.array(z.object({
      sku: z.string().describe("SKU del producto"),
      quantity: z.number().int().positive().describe("Cantidad del producto")
    })).min(1).describe("Lista de productos y cantidades"),
    deliveryAddress: z.string().optional().describe("Dirección de entrega (opcional)"),
    notes: z.string().optional().describe("Notas adicionales (opcional)")
  }),
  execute: async ({ phone, clientId, items, deliveryAddress, notes }) => {
    const salespersonId = await userRepo.getSalespersonIdByPhone(phone);
    if (!salespersonId) {
      throw new Error(`No se encontró vendedor con teléfono ${phone}`);
    }
    return orderService.createOrderForSalesperson(salespersonId, clientId, items, deliveryAddress, notes);
  },
});

export const confirmarOrden = tool({
  description: "Confirma una orden existente por ID y descuenta el stock correspondiente.",
  inputSchema: z.object({
    orderId: z.string().describe("ID de la orden a confirmar")
  }),
  execute: async ({ orderId }) => {
    const order = await orderService.confirmOrder(orderId);
    if (!order) {
      throw new Error(`Orden no encontrada: ${orderId}`);
    }
    return order;
  },
});

export const listarClientes = tool({
  description: "Lista todos los clientes de la distribuidora del vendedor.",
  inputSchema: z.object({
    phone: z.string().describe("Número de teléfono del vendedor"),
    query: z.string().optional().describe("Filtro opcional de búsqueda por nombre")
  }),
  execute: async ({ phone, query }) => {
    const distributorId = await getDistributorFromContext(phone);

    if (query) {
      return customerService.searchForDistributor(distributorId, query);
    }

    return customerService.listForDistributor(distributorId);
  },
});

export const buscarClientes = tool({
  description: "Busca clientes por nombre o email en la distribuidora del vendedor.",
  inputSchema: z.object({
    phone: z.string().describe("Número de teléfono del vendedor"),
    query: z.string().describe("Texto de búsqueda para clientes")
  }),
  execute: async ({ phone, query }) => {
    const distributorId = await getDistributorFromContext(phone);
    return customerService.searchForDistributor(distributorId, query);
  },
});

export const obtenerOrden = tool({
  description: "Obtiene una orden por su ID.",
  inputSchema: z.object({
    orderId: z.string().describe("ID de la orden")
  }),
  execute: async ({ orderId }) => {
    return orderService.getOrderById(orderId);
  },
});

export const tools = {
  consultarCatalogo,
  buscarProductos,
  consultarStock,
  crearOrden,
  confirmarOrden,
  listarClientes,
  buscarClientes,
  obtenerOrden,
};
