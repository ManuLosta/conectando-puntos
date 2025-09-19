import { stepCountIs, generateText, ModelMessage } from "ai";
import { chatModel } from "@/lib/ai/provider";
import { whatsAppMessageService } from "@/services/whatsapp-message.service";
import { userRepo } from "@/repositories/user.repository";
import { tools } from "@/lib/ai/tools";
import { WhatsAppFormattedMessage } from "@/services/whatsapp-formatter.service";

const SYSTEM_PROMPT = `
Eres un asistente de pedidos para vendedores de distribuidoras. Utiliza mensajes estructurados con formato WhatsApp apropiado.

FORMATO DE RESPUESTA:
- Usa *texto en negrita* para títulos importantes
- Usa emojis estratégicamente (1-3 por mensaje)
- Estructura con headers, body y acciones cuando sea necesario
- Para confirmaciones SÍ/NO, siempre responde en formato JSON: {"requiresConfirmation": true, "message": "texto", "orderId": "id_opcional"}
- Para otros mensajes, responde en formato JSON: {"message": "texto_formateado"} o usa el formatter service

IMPORTANTE: Cuando presentes sugerencias de productos, SIEMPRE debes explicar el ranking y el motivo por el cual cada producto es sugerido y su posición en la lista. Los descuentos deben destacarse prominentemente.

Entrada típica: "Cliente: items". Ej.: "Supermercado Don Pepe: 10 kg queso la serenisima".

Flujo OBLIGATORIO:
1) Valida el CLIENTE: llamá a listarClientes o buscarClientes. Si no existe, presenta opciones estructuradas.
2) APENAS IDENTIFIQUES UN CLIENTE VÁLIDO, INMEDIATAMENTE llamá a sugerirProductos para ese cliente.
3) SIEMPRE presenta las sugerencias de productos usando formato estructurado con ranking, precios y motivos claros.
4) Para productos con descuento, usa: "🏷️ *X% OFF*" prominentemente.
5) Si el usuario mencionó productos específicos, identificá productos y cantidades y consultá stock.
6) Si hay datos suficientes, creá ORDEN BORRADOR con formato estructurado.
7) ANTES de cerrar el resumen del borrador, VOLVÉ A RECOMENDAR productos adicionales.
8) Para confirmaciones, usa SIEMPRE botones interactivos.

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

function isTextPart(p: unknown): p is { type: "text"; text: string } {
  return (
    typeof p === "object" &&
    p !== null &&
    "type" in p &&
    (p as { type?: unknown }).type === "text" &&
    "text" in p &&
    typeof (p as { text?: unknown }).text === "string"
  );
}

function extractTextContent(content: unknown): string {
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    try {
      return content
        .filter(isTextPart)
        .map((p) => p.text)
        .join(" ")
        .trim();
    } catch {
      return "";
    }
  }
  return "";
}

function separateTextAndJson(text: string): {
  cleanText: string;
  jsonData?: Record<string, unknown>;
} {
  try {
    // Primero intentar parsear todo el texto como JSON
    const fullJson = JSON.parse(text);
    return { cleanText: "", jsonData: fullJson };
  } catch {
    // Si no es JSON puro, buscar JSON mezclado con texto
  }

  // 1. Buscar cualquier línea que empiece con { (puede ser JSON parcial)
  // Si encontramos JSON parcial/malformado, removemos todo desde esa línea
  const lines = text.split("\n");
  let jsonStartLine = -1;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith("{")) {
      jsonStartLine = i;
      break;
    }
  }

  if (jsonStartLine !== -1) {
    // Intentar parsear desde esa línea hacia abajo como JSON
    const jsonLines = lines.slice(jsonStartLine);
    const potentialJson = jsonLines.join("\n");

    try {
      const cleanedJson = potentialJson.replace(/\s+/g, " ").trim();
      const jsonData = JSON.parse(cleanedJson);
      const cleanText = lines.slice(0, jsonStartLine).join("\n").trim();
      return { cleanText, jsonData };
    } catch {
      // JSON malformado o incompleto - remover todo desde la línea de JSON
      const cleanText = lines.slice(0, jsonStartLine).join("\n").trim();
      return { cleanText };
    }
  }

  // Si no hay JSON válido, devolver todo como texto
  return { cleanText: text };
}

export async function runAgent({
  phoneNumber,
  userText,
}: {
  phoneNumber: string;
  userText: string;
  interactionId?: string;
}): Promise<WhatsAppFormattedMessage> {
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

    const { response } = await generateText({
      model: chatModel,
      system: SYSTEM_PROMPT,
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

    // Extract assistant response
    const last = response.messages[response.messages.length - 1];
    const assistantText = extractTextContent(last?.content as unknown) || "";

    // Save user message and assistant response to database
    await whatsAppMessageService.addMessage(session.id, "user", trimmedText);
    if (assistantText) {
      await whatsAppMessageService.addMessage(
        session.id,
        "assistant",
        assistantText,
      );
    }

    // Separar texto y JSON de la respuesta del agente
    const { cleanText, jsonData } = separateTextAndJson(assistantText);

    // Si hay JSON válido, procesarlo
    if (jsonData) {
      if (jsonData.requiresConfirmation) {
        // Import WhatsAppFormatterService here to avoid circular dependencies
        const { WhatsAppFormatterService } = await import(
          "@/services/whatsapp-formatter.service"
        );
        return WhatsAppFormatterService.createConfirmation(
          typeof jsonData.message === "string" ? jsonData.message : "",
          typeof jsonData.orderId === "string" ? jsonData.orderId : undefined,
        );
      }

      if (jsonData.message && typeof jsonData.message === "string") {
        return { text: jsonData.message };
      }
    }

    // Si hay texto limpio (sin JSON), formatearlo y enviarlo
    if (cleanText) {
      const { WhatsAppFormatterService } = await import(
        "@/services/whatsapp-formatter.service"
      );
      return { text: WhatsAppFormatterService.formatText(cleanText) };
    }

    return { text: "Entendido." };
  } catch (error) {
    console.error("Error in runAgent:", error);
    throw error;
  }
}
