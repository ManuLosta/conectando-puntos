import { z } from "zod";
import { tool } from "ai";
import { orderService } from "@/services/order.service";
import { stockService } from "@/services/stock.service";
import { suggestionService } from "@/services/suggestion.service";

export const consultarStock = tool({
  description:
    "Consulta disponibilidad de productos por búsqueda de texto o SKU. Puede buscar múltiples productos separados por comas.",
  inputSchema: z
    .object({
      query: z.string().describe("Texto de búsqueda para productos"),
    })
    .strict(),
  execute: async ({ query }, { experimental_context }) => {
    const { distributorId } = experimental_context as {
      distributorId: string;
      phoneNumber: string;
      clientId?: string;
    };
    return stockService.searchStock(distributorId, query);
  },
});

export const crearPedido = tool({
  description:
    "Crea un pedido para el cliente con validación de stock y disponibilidad.",
  inputSchema: z
    .object({
      items: z
        .array(
          z
            .object({
              sku: z.string().describe("SKU del producto"),
              quantity: z
                .number()
                .int()
                .positive()
                .describe("Cantidad del producto"),
            })
            .strict(),
        )
        .min(1)
        .describe("Lista de productos y cantidades"),
      deliveryAddress: z
        .string()
        .optional()
        .describe("Dirección de entrega (opcional)"),
      notes: z.string().optional().describe("Notas adicionales (opcional)"),
    })
    .strict(),
  execute: async (
    { items, deliveryAddress, notes },
    { experimental_context },
  ) => {
    const { distributorId, clientId } = experimental_context as {
      distributorId: string;
      phoneNumber: string;
      clientId?: string;
    };

    if (!clientId) {
      throw new Error("No se pudo identificar el cliente para crear el pedido");
    }

    return orderService.createOrderForClient(
      distributorId,
      clientId,
      items,
      deliveryAddress,
      notes,
    );
  },
});

export const sugerirProductos = tool({
  description:
    "Obtiene recomendaciones de productos basadas en compras anteriores y ofertas especiales.",
  inputSchema: z
    .object({
      asOf: z
        .string()
        .optional()
        .describe(
          "Fecha de referencia para las sugerencias (formato ISO string, ej: 2024-01-01T00:00:00Z)",
        ),
      top: z
        .number()
        .int()
        .min(1)
        .max(100)
        .default(5)
        .optional()
        .describe("Número máximo de productos a sugerir (por defecto 5)"),
    })
    .strict(),
  execute: async ({ asOf, top }, { experimental_context }) => {
    const { distributorId, clientId } = experimental_context as {
      distributorId: string;
      phoneNumber: string;
      clientId?: string;
    };

    if (!clientId) {
      throw new Error("No se pudo identificar el cliente para las sugerencias");
    }

    const referenceDate = asOf ? new Date(asOf) : new Date();
    const suggestions = await suggestionService.suggestProducts(
      distributorId,
      clientId,
      referenceDate,
      top ?? 5,
    );
    return suggestions;
  },
});

export const obtenerPedido = tool({
  description: "Consulta el estado de un pedido por su ID.",
  inputSchema: z
    .object({
      orderId: z.string().describe("ID del pedido"),
    })
    .strict(),
  execute: async ({ orderId }) => {
    return orderService.getOrderById(orderId);
  },
});

export const consumerTools = {
  consultarStock,
  crearPedido,
  sugerirProductos,
  obtenerPedido,
};
