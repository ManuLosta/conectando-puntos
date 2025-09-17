import { z } from "zod";
import { tool } from "ai";
import { catalogService } from "@/services/catalog.service";
import { orderService } from "@/services/order.service";
import { customerService } from "@/services/customer.service";
import { stockService } from "@/services/stock.service";
import { suggestionService } from "@/services/suggestion.service";

export const consultarCatalogo = tool({
  description:
    "Consulta el catálogo completo de productos disponibles para la distribuidora del vendedor.",
  inputSchema: z.object({}),
  execute: async (_, { experimental_context }) => {
    const { distributorId } = experimental_context as {
      distributorId: string;
      phoneNumber: string;
      salespersonId: string;
    };
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
  execute: async ({ keyword }, { experimental_context }) => {
    const { distributorId } = experimental_context as {
      distributorId: string;
      phoneNumber: string;
      salespersonId: string;
    };
    return catalogService.searchProductsByKeyword(distributorId, keyword);
  },
});

export const consultarStock = tool({
  description:
    "Consulta stock de productos por búsqueda de texto o SKU. Puede buscar múltiples productos separados por comas.",
  inputSchema: z.object({
    query: z.string().describe("Texto de búsqueda para productos"),
  }),
  execute: async ({ query }, { experimental_context }) => {
    const { distributorId } = experimental_context as {
      distributorId: string;
      phoneNumber: string;
      salespersonId: string;
    };
    return stockService.searchForDistributor(distributorId, query);
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
  execute: async (
    { clientId, items, deliveryAddress, notes },
    { experimental_context },
  ) => {
    const { distributorId, salespersonId } = experimental_context as {
      distributorId: string;
      phoneNumber: string;
      salespersonId: string;
    };
    return orderService.createOrderForSalesperson(
      salespersonId,
      distributorId,
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
    top: z
      .optional(z.number().int().min(1).max(100).default(10))
      .describe("Número máximo de productos a sugerir (por defecto 10)"),
  }),
  execute: async ({ clientId, asOf, top }, { experimental_context }) => {
    const { distributorId } = experimental_context as {
      distributorId: string;
      phoneNumber: string;
      salespersonId: string;
    };
    const referenceDate = asOf ? new Date(asOf) : new Date();
    const suggestions = await suggestionService.suggestProducts(
      distributorId,
      clientId,
      referenceDate,
      top ?? 10,
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
  execute: async ({ query }, { experimental_context }) => {
    const { distributorId } = experimental_context as {
      distributorId: string;
      phoneNumber: string;
      salespersonId: string;
    };

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
  execute: async ({ query }, { experimental_context }) => {
    const { distributorId } = experimental_context as {
      distributorId: string;
      phoneNumber: string;
      salespersonId: string;
    };
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
