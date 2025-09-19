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
6) Si hay datos suficientes, creá UNA SOLA ORDEN BORRADOR con crearOrden y GUARDA EL ID.
7) NUNCA crees múltiples órdenes. Si ya creaste una orden borrador, usa confirmarOrden con ese mismo ID.
8) Para confirmaciones, usa el formato JSON con requiresConfirmation y el orderId del borrador.

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
  // Primero, limpiar caracteres de escape
  const cleanedText = text.replace(/\\n/g, "\n").replace(/\\"/g, '"');

  try {
    // Si todo el texto es JSON válido, retornarlo
    const fullJson = JSON.parse(cleanedText);
    return { cleanText: "", jsonData: fullJson };
  } catch {
    // No es JSON puro, continuar
  }

  // Buscar patrones de JSON al final del texto después de saltos de línea
  const lines = cleanedText.split("\n");
  let jsonData: Record<string, unknown> | undefined;
  let textLines: string[] = [];

  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].trim();

    // Si la línea parece JSON (empieza con { y termina con })
    if (line.startsWith("{") && line.endsWith("}")) {
      try {
        jsonData = JSON.parse(line);
        // Si se parseó correctamente, todas las líneas anteriores son texto
        textLines = lines.slice(0, i);
        break;
      } catch {
        // No es JSON válido, continuar
        textLines.unshift(lines[i]);
      }
    } else if (line.length > 0) {
      // Línea con contenido que no es JSON
      textLines.unshift(lines[i]);
    }
  }

  // Si no encontramos JSON, buscar con el método anterior
  if (!jsonData) {
    const firstBrace = cleanedText.indexOf("{");
    const lastBrace = cleanedText.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const potentialJson = cleanedText.substring(firstBrace, lastBrace + 1);

      try {
        jsonData = JSON.parse(potentialJson);
        const cleanText = cleanedText.substring(0, firstBrace).trim();
        return { cleanText, jsonData };
      } catch {
        // JSON malformado, ignorarlo
      }
    }
  }

  const cleanText = textLines.join("\n").trim();
  return { cleanText, jsonData };
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
