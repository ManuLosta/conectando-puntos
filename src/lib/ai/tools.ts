import { z } from "zod";
import { tool } from "ai";
import { catalogService } from "@/services/catalog.service";
import { orderService } from "@/services/order.service";
import { customerService } from "@/services/customer.service";
import { stockRepo } from "@/repositories/stock.repository";
import { userRepo } from "@/repositories/user.repository";
import { phoneContext } from "@/lib/context/phone-context";
import { suggestionService } from "@/services/suggestion.service";

async function getDistributorFromContext(): Promise<string> {
  const phone = phoneContext.requirePhoneNumber();
  const distributorId = await userRepo.getSalespersonDistributorByPhone(phone);
  if (!distributorId) {
    throw new Error(
      `No se encontró distribuidora para el vendedor con teléfono ${phone}`,
    );
  }
  return distributorId;
}

export const consultarCatalogo = tool({
  description:
    "Consulta el catálogo completo de productos disponibles para la distribuidora del vendedor.",
  inputSchema: z.object({}),
  execute: async () => {
    const distributorId = await getDistributorFromContext();
    return catalogService.getCatalogForDistributor(distributorId);
  },
});

export const buscarProductos = tool({
  description:
    "Busca productos por palabra clave o SKU en el catálogo de la distribuidora.",
  inputSchema: z.object({
    keyword: z
      .string()
      .describe("Palabra clave para buscar productos por nombre o SKU"),
  }),
  execute: async ({ keyword }) => {
    const distributorId = await getDistributorFromContext();
    return catalogService.searchProductsByKeyword(distributorId, keyword);
  },
});

export const consultarStock = tool({
  description:
    "Consulta stock de productos por búsqueda de texto o SKU. Puede buscar múltiples productos separados por comas.",
  inputSchema: z.object({
    query: z.string().describe("Texto de búsqueda para productos"),
  }),
  execute: async ({ query }) => {
    const distributorId = await getDistributorFromContext();
    return stockRepo.searchForDistributor(distributorId, query);
  },
});

export const crearOrden = tool({
  description:
    "Crea una orden completa para un cliente específico con validación de stock.",
  inputSchema: z.object({
    clientId: z.string().describe("ID del cliente para quien se crea la orden"),
    items: z
      .array(
        z.object({
          sku: z.string().describe("SKU del producto"),
          quantity: z
            .number()
            .int()
            .positive()
            .describe("Cantidad del producto"),
        }),
      )
      .min(1)
      .describe("Lista de productos y cantidades"),
    deliveryAddress: z
      .string()
      .optional()
      .describe("Dirección de entrega (opcional)"),
    notes: z.string().optional().describe("Notas adicionales (opcional)"),
  }),
  execute: async ({ clientId, items, deliveryAddress, notes }) => {
    const phone = phoneContext.requirePhoneNumber();
    const salespersonId = await userRepo.getSalespersonIdByPhone(phone);
    if (!salespersonId) {
      throw new Error(`No se encontró vendedor con teléfono ${phone}`);
    }
    return orderService.createOrderForSalesperson(
      salespersonId,
      clientId,
      items,
      deliveryAddress,
      notes,
    );
  },
});

export const confirmarOrden = tool({
  description:
    "Confirma una orden existente por ID y descuenta el stock correspondiente.",
  inputSchema: z.object({
    orderId: z.string().describe("ID de la orden a confirmar"),
  }),
  execute: async ({ orderId }) => {
    const order = await orderService.confirmOrder(orderId);
    if (!order) {
      throw new Error(`Orden no encontrada: ${orderId}`);
    }
    return order;
  },
});

export const sugerirProductos = tool({
  description:
    "Sugiere productos para vender más: expiran pronto o habituales del cliente.",
  inputSchema: z.object({
    clientId: z.string().describe("ID del cliente para sugerencias"),
    asOf: z
      .string()
      .optional()
      .describe(
        "Fecha de referencia para las sugerencias (formato ISO string, ej: 2024-01-01T00:00:00Z)",
      ),
  }),
  execute: async ({ clientId, asOf }) => {
    const distributorId = await getDistributorFromContext();
    const referenceDate = asOf ? new Date(asOf) : new Date();
    const suggestions = await suggestionService.suggestProducts(
      distributorId,
      clientId,
      referenceDate,
    );
    return suggestions;
  },
});

export const listarClientes = tool({
  description: "Lista todos los clientes de la distribuidora del vendedor.",
  inputSchema: z.object({
    query: z
      .string()
      .optional()
      .describe("Filtro opcional de búsqueda por nombre"),
  }),
  execute: async ({ query }) => {
    const distributorId = await getDistributorFromContext();

    if (query) {
      return customerService.searchForDistributor(distributorId, query);
    }

    return customerService.listForDistributor(distributorId);
  },
});

export const buscarClientes = tool({
  description:
    "Busca clientes por nombre o email en la distribuidora del vendedor.",
  inputSchema: z.object({
    query: z.string().describe("Texto de búsqueda para clientes"),
  }),
  execute: async ({ query }) => {
    const distributorId = await getDistributorFromContext();
    return customerService.searchForDistributor(distributorId, query);
  },
});

export const obtenerOrden = tool({
  description: "Obtiene una orden por su ID.",
  inputSchema: z.object({
    orderId: z.string().describe("ID de la orden"),
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
  sugerirProductos,
  listarClientes,
  buscarClientes,
  obtenerOrden,
};
