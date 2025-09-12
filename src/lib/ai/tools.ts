import { z } from "zod";
import { tool } from "ai";
import { catalogService } from "@/services/catalog";
import { orderService } from "@/services/order";
import { customerService } from "@/services/customer";
import { suggestionService } from "@/services/suggestion";

export const consultarStock = tool({
  description:
    "Consulta stock por texto o SKU. Puede buscar múltiples productos separados por comas.",
  inputSchema: z.object({ query: z.string() }),
  execute: async ({ query }) => {
    return catalogService.searchStock(query);
  },
});

export const crearOrdenBorrador = tool({
  description: "Crea un borrador de orden para un cliente por nombre.",
  inputSchema: z.object({
    customer: z.string(),
    items: z
      .array(
        z.object({
          sku: z.string(),
          qty: z.number().int().positive(),
        }),
      )
      .min(1),
  }),
  execute: async ({ customer, items }) => {
    const order = orderService.createDraftOrder(customer, items);
    return order;
  },
});

export const confirmarOrden = tool({
  description:
    "Confirma una orden existente por ID (cambia a CONFIRMED y descuenta stock).",
  inputSchema: z.object({ orderId: z.string() }),
  execute: async ({ orderId }) => {
    const order = orderService.confirmOrder(orderId);
    if (!order) {
      throw new Error(`Orden no encontrada: ${orderId}`);
    }
    return order;
  },
});

export const listarClientes = tool({
  description:
    "Devuelve la lista de clientes (puede filtrar por texto opcional).",
  inputSchema: z.object({ query: z.string().optional() }),
  execute: async ({ query }) => {
    const list = customerService.list();
    if (!query) return list;
    const q = query.trim().toLowerCase();
    return list.filter((c) => c.name.toLowerCase().includes(q));
  },
});

export const sugerirProductos = tool({
  description:
    "Sugiere productos para el cliente (vencimientos próximos y compras previas).",
  inputSchema: z.object({
    customer: z.string(),
    topN: z.number().int().positive().max(10).optional(),
  }),
  execute: async ({ customer, topN }) => {
    if (!customerService.exists(customer)) {
      throw new Error(`Cliente no encontrado: ${customer}`);
    }
    return suggestionService.suggestProducts(customer, topN ?? 5);
  },
});

export const tools = {
  consultarStock,
  crearOrdenBorrador,
  confirmarOrden,
  listarClientes,
  sugerirProductos,
};
