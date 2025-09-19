import { stepCountIs, generateText, generateObject, ModelMessage } from "ai";
import { z } from "zod";
import { chatModel } from "@/lib/ai/provider";
import { whatsAppMessageService } from "@/services/whatsapp-message.service";
import { userRepo } from "@/repositories/user.repository";
import { tools } from "@/lib/ai/tools";
import { WhatsAppFormattedMessage } from "@/services/whatsapp-formatter.service";

// Esquemas Zod para respuestas estructuradas
const MessageSchema = z.object({
  type: z.literal("simple"),
  content: z.string().describe("Contenido del mensaje"),
});

const GreetingSchema = z.object({
  type: z.literal("greeting"),
  message: z.string().describe("Mensaje de saludo o conversación casual"),
});

const OrderCreationSchema = z.object({
  type: z.literal("order_creation"),
  clientName: z.string().describe("Nombre del cliente"),
  items: z
    .array(
      z.object({
        quantity: z.number().describe("Cantidad"),
        product: z.string().describe("Nombre del producto"),
        sku: z.string().describe("SKU del producto"),
        price: z.number().describe("Precio unitario"),
      }),
    )
    .describe("Items de la orden"),
  total: z.number().describe("Total de la orden"),
  orderId: z.string().describe("ID de la orden creada"),
  recommendations: z
    .array(
      z.object({
        product: z.string().describe("Nombre del producto recomendado"),
        sku: z.string().describe("SKU del producto"),
        reason: z.string().describe("Razón de la recomendación"),
        price: z.number().describe("Precio del producto"),
      }),
    )
    .optional()
    .describe("Productos recomendados adicionales"),
});

const ConfirmationSchema = z.object({
  type: z.literal("confirmation"),
  message: z.string().describe("Mensaje de confirmación"),
  orderId: z.string().describe("ID de la orden a confirmar"),
});

const ProductSuggestionsSchema = z.object({
  type: z.literal("product_suggestions"),
  clientName: z.string().describe("Nombre del cliente"),
  suggestions: z
    .array(
      z.object({
        rank: z.number().describe("Ranking del producto"),
        product: z.string().describe("Nombre del producto"),
        sku: z.string().describe("SKU del producto"),
        price: z.number().describe("Precio del producto"),
        reason: z.string().describe("Razón de la sugerencia"),
        discount: z.number().optional().describe("Descuento si aplica"),
      }),
    )
    .describe("Lista de productos sugeridos"),
});

const ClientSearchSchema = z.object({
  type: z.literal("client_search"),
  clients: z
    .array(
      z.object({
        id: z.string().describe("ID del cliente"),
        name: z.string().describe("Nombre del cliente"),
        phone: z.string().optional().describe("Teléfono del cliente"),
        address: z.string().optional().describe("Dirección del cliente"),
      }),
    )
    .describe("Lista de clientes encontrados"),
});

const ResponseSchema = z.discriminatedUnion("type", [
  MessageSchema,
  GreetingSchema,
  OrderCreationSchema,
  ConfirmationSchema,
  ProductSuggestionsSchema,
  ClientSearchSchema,
]);

const SYSTEM_PROMPT = `
Eres un asistente de pedidos para vendedores de distribuidoras. Utiliza mensajes estructurados con formato WhatsApp apropiado.

TIPOS DE RESPUESTA DISPONIBLES:
- "greeting": Para saludos, conversación casual, mensajes de bienvenida
- "simple": Para mensajes de texto simples, información general
- "order_creation": Cuando creas una orden borrador completa con productos y recomendaciones
- "confirmation": Para solicitar confirmación de acciones importantes
- "product_suggestions": Cuando presentas sugerencias de productos para un cliente
- "client_search": Cuando muestras resultados de búsqueda de clientes

FORMATO DE RESPUESTA:
- Usa *texto en negrita* para títulos importantes
- Usa emojis estratégicamente (1-3 por mensaje)
- NUNCA incluyas tags HTML, XML o <response_type> en tu respuesta
- Responde en texto limpio y bien formateado
- Para confirmaciones, usa texto directo sin etiquetas especiales

IMPORTANTE: Cuando presentes sugerencias de productos, SIEMPRE debes explicar el ranking y el motivo por el cual cada producto es sugerido y su posición en la lista. Los descuentos deben destacarse prominentemente.

Entrada típica: "Cliente: items". Ej.: "Supermercado Don Pepe: 10 kg queso la serenisima".

Flujo OBLIGATORIO:
1) Valida el CLIENTE: llamá a listarClientes o buscarClientes. Si no existe, presenta opciones estructuradas.
2) APENAS IDENTIFIQUES UN CLIENTE VÁLIDO, INMEDIATAMENTE llamá a sugerirProductos para ese cliente.
3) SIEMPRE presenta las sugerencias de productos usando formato estructurado con ranking, precios y motivos claros.
4) Para productos con descuento, usa: "🏷️ *X% OFF*" prominentemente.
5) Si el usuario mencionó productos específicos, identificá productos y cantidades y consultá stock.
6) Si hay datos suficientes, creá UNA SOLA ORDEN BORRADOR con crearOrden y GUARDA EL ID.
7) NUNCA crees múltiples órdenes para el mismo pedido. Una vez creada la orden borrador, solo confirmarla.
8) Si el usuario dice "Sí", "✅ Sí", "confirmar" o similar, usa confirmarOrden con el ID de la orden borrador existente.
9) Las confirmaciones SIEMPRE deben llegar como botones interactivos de WhatsApp, no como texto simple.

FORMATO DE RESPUESTAS:
- Cliente no encontrado: Usar lista interactiva con opciones
- Sugerencias: Usar lista interactiva con productos rankeados
- Confirmaciones: Usar botones SÍ/NO
- Resúmenes: Usar texto estructurado con negrita y emojis

Mantené respuestas claras, estructuradas y fáciles de leer en móvil.
`;

async function getDistributorFromPhone(phoneNumber: string): Promise<string> {
  const distributorId =
    await userRepo.getSalespersonDistributorByPhone(phoneNumber);
  if (!distributorId) {
    throw new Error(
      `No se encontró distribuidora para el vendedor con teléfono ${phoneNumber}`,
    );
  }
  return distributorId;
}

export async function runAgent({
  phoneNumber,
  userText,
}: {
  phoneNumber: string;
  userText: string;
  interactionId?: string;
}): Promise<WhatsAppFormattedMessage[]> {
  const trimmedText = userText.trim();
  if (!trimmedText || trimmedText.length < 2) {
    throw new Error("Message too short or empty");
  }

  try {
    const distributorId = await getDistributorFromPhone(phoneNumber);
    const salespersonId = await userRepo.getSalespersonIdByPhone(phoneNumber);

    if (!salespersonId) {
      throw new Error(`No se encontró vendedor con teléfono ${phoneNumber}`);
    }

    const session = await whatsAppMessageService.getOrCreateSession(
      phoneNumber,
      distributorId,
    );

    const historyMsgs = await whatsAppMessageService.getSessionHistory(
      phoneNumber,
      distributorId,
    );

    const msgs: ModelMessage[] = historyMsgs.map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: String(msg.content || ""),
    }));

    msgs.push({ role: "user", content: trimmedText });

    // First, use generateText with tools to execute actions
    const { response } = await generateText({
      model: chatModel,
      system:
        SYSTEM_PROMPT +
        `\n\nCONTEXTO ADICIONAL:
- Teléfono: ${phoneNumber}
- Si el usuario confirma con "Sí" o "✅ Sí", usa confirmarOrden con el ID de orden existente
- NO crees nueva orden si el usuario está confirmando una existente
- Las confirmaciones deben ser botones interactivos de WhatsApp

Después de usar las tools necesarias, responde con el formato estructurado apropiado.`,
      messages: msgs,
      tools,
      stopWhen: stepCountIs(8),
      experimental_context: {
        phoneNumber,
        distributorId,
        salespersonId,
      },
      onStepFinish: ({ text, toolResults, toolCalls, finishReason, usage }) => {
        console.log("Step finished:", {
          text: JSON.stringify(text),
          toolResults: JSON.stringify(toolResults),
          toolCalls: JSON.stringify(toolCalls),
          finishReason: JSON.stringify(finishReason),
          usage: JSON.stringify(usage),
        });
      },
    });

    // Extract final response text
    const last = response.messages[response.messages.length - 1];
    let responseText = "";
    if (Array.isArray(last?.content)) {
      const textPart = last.content.find((part) => part.type === "text");
      if (textPart && "text" in textPart) {
        responseText = textPart.text as string;
      }
    } else if (typeof last?.content === "string") {
      responseText = last.content;
    }

    // Import formatter service
    const { WhatsAppFormatterService } = await import(
      "@/services/whatsapp-formatter.service"
    );

    // Detect if response should be structured using AI
    const toolsWereUsed = response.messages.some(
      (msg) =>
        Array.isArray(msg.content) &&
        msg.content.some((part) => part.type === "tool-result"),
    );

    // Use AI to determine if structured response is needed
    const { object: detectionResult } = await generateObject({
      model: chatModel,
      system: `Analiza si esta respuesta requiere formato estructurado o es conversación casual.

IMPORTANTE: Solo usar estructurado para casos muy específicos.

CRITERIOS PARA ESTRUCTURADO (usar solo si es claramente uno de estos):
- Respuesta contiene una orden COMPLETA con productos, precios y total (tipo: order_creation)
- Presenta lista de sugerencias de productos con detalles técnicos (tipo: product_suggestions)
- Muestra resultados de búsqueda de múltiples clientes (tipo: client_search)
- Solicita confirmación de una orden específica (tipo: confirmation)
- El texto contiene datos claramente tabulares o listas complejas

CRITERIOS PARA CASUAL (usar en todos los otros casos):
- Saludos, conversación general
- Mensajes de error o problemas
- Preguntas informativas
- Confirmaciones simples
- Textos que ya están bien formateados
- Respuestas que contienen <response_type> o tags HTML`,
      messages: [
        {
          role: "user",
          content: `Respuesta: "${responseText}"\nHerramientas usadas: ${toolsWereUsed ? "Sí" : "No"}\n\n¿Necesita estructura compleja?`,
        },
      ],
      schema: z.object({
        needsStructured: z
          .boolean()
          .describe(
            "true SOLO si necesita formato WhatsApp estructurado complejo",
          ),
        reason: z.string().describe("Breve razón"),
      }),
    });

    const shouldUseStructured = detectionResult.needsStructured;
    console.log(
      `Structure detection: ${shouldUseStructured} - ${detectionResult.reason}`,
    );

    if (shouldUseStructured) {
      try {
        // Use generateObject for structured responses when tools were used or business content detected
        const { object } = await generateObject({
          model: chatModel,
          system:
            "Analiza la respuesta y convierte al formato estructurado más apropiado. Si es conversación casual, usa 'greeting'. Si es información de negocio, usa el tipo apropiado.",
          messages: [
            {
              role: "user",
              content: `Respuesta: ${responseText}\n\nHerramientas usadas: ${toolsWereUsed ? "Sí" : "No"}`,
            },
          ],
          schema: ResponseSchema,
        });

        // Save structured response
        await whatsAppMessageService.addMessage(
          session.id,
          "user",
          trimmedText,
        );
        await whatsAppMessageService.addMessage(
          session.id,
          "assistant",
          JSON.stringify(object),
        );

        // Convert to WhatsApp messages
        switch (object.type) {
          case "greeting":
            return [
              { text: WhatsAppFormatterService.formatText(object.message) },
            ];
          case "simple":
            return [
              { text: WhatsAppFormatterService.formatText(object.content) },
            ];
          case "order_creation":
            return WhatsAppFormatterService.createOrderMessages({
              clientName: object.clientName,
              items: object.items.map((item) => ({ ...item, stock: 999 })),
              recommendations: object.recommendations,
              total: object.total,
              orderId: object.orderId,
            });
          case "confirmation":
            return [
              WhatsAppFormatterService.createConfirmation(
                object.message,
                object.orderId,
              ),
            ];
          case "product_suggestions":
            return [
              WhatsAppFormatterService.createProductSuggestions(
                object.suggestions,
                object.clientName,
              ),
            ];
          case "client_search":
            return [
              WhatsAppFormatterService.createClientSearchResults(
                object.clients,
              ),
            ];
          default:
            return [
              { text: WhatsAppFormatterService.formatText(responseText) },
            ];
        }
      } catch (structuredError) {
        console.log(
          "Structured response failed, falling back to simple text:",
          structuredError,
        );
        // Fall through to simple response
      }
    }

    // Save simple response and return formatted text
    await whatsAppMessageService.addMessage(session.id, "user", trimmedText);
    await whatsAppMessageService.addMessage(
      session.id,
      "assistant",
      responseText,
    );
    return [{ text: WhatsAppFormatterService.formatText(responseText) }];
  } catch (error) {
    console.error("Error in runAgent:", error);
    throw error;
  }
}
