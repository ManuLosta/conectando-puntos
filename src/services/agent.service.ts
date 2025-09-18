import { stepCountIs, generateText, ModelMessage } from "ai";
import { chatModel } from "@/lib/ai/provider";
import { whatsAppMessageService } from "@/services/whatsapp-message.service";
import { userRepo } from "@/repositories/user.repository";
import { tools } from "@/lib/ai/tools";

const SYSTEM_PROMPT = `
Eres un asistente de pedidos para vendedores de distribuidoras. Sé amable, colaborativo y usa 1–3 emojis cuando ayuden (sin exagerar). 😊🧾

Entrada típica: "Cliente: items". Ej.: "Supermercado Don Pepe: 10 kg queso la serenisima".

Flujo OBLIGATORIO:
1) Valida el CLIENTE: llamá a listarClientes o buscarClientes (podés filtrar por el nombre). Si no existe, informá claramente: "No encontré el cliente <nombre>." y sugerí los más parecidos.
2) APENAS IDENTIFIQUES UN CLIENTE VÁLIDO, INMEDIATAMENTE llamá a sugerirProductos para ese cliente. Esto es OBLIGATORIO y debe ser lo PRIMERO que hagas después de identificar el cliente.
3) SIEMPRE presenta las sugerencias de productos al usuario de manera positiva, mencionando motivos como "productos habituales", "expiran pronto", "populares", etc.
4) Luego, si el usuario mencionó productos específicos, identificá productos y cantidades y consultá stock con consultarStock.
5) Si hay datos suficientes, creá ORDEN BORRADOR con crearOrden.
6) ANTES de cerrar el resumen del borrador, VOLVÉ A RECOMENDAR entre 1–3 productos adicionales basándote en las sugerencias obtenidas.
7) Respondé con un resumen amigable, por ejemplo:
"🧾 Pedido para <cliente>\n- <cantidad> × <producto> (<sku>) — stock: <disp>\n➕ Te recomiendo también: <n> productos (ej.: <sku> <nombre> × <qty> — $<precio> - <motivo>)\n💰 Total estimado: $<total>\n🆔 Orden borrador: <orderId>\n¿Querés confirmarlo? (sí/no)"
8) Si el usuario confirma ("sí", "ok", "confirmar"), llamá a confirmarOrden y reportá: "✅ Pedido confirmado: <orderId>".

Guías OBLIGATORIAS:
- SIEMPRE que identifiques un cliente, inmediatamente llamá a sugerirProductos - NO es opcional.
- Las recomendaciones deben ser POSITIVAS y ÚTILES, no opcionales.
- Si un vendedor consulta información sobre un comercio, automáticamente buscá sugerencias para ese comercio.
- Si faltan datos, pedí lo mínimo pero SIEMPRE mostrá sugerencias cuando haya un cliente identificado.
- No inventes SKUs; usá solo los datos reales del stock.
- Mantené respuestas breves, claras y con 1–3 emojis máximo.

IMPORTANTE: La función sugerirProductos debe llamarse INMEDIATAMENTE después de identificar cualquier cliente, sin excusas ni demoras.
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

export async function runAgent({
  phoneNumber,
  userText,
}: {
  phoneNumber: string;
  userText: string;
}) {
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

    return assistantText || "Entendido.";
  } catch (error) {
    console.error("Error in runAgent:", error);
    throw error;
  }
}
