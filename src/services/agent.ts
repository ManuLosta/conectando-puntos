import { stepCountIs, generateText, ModelMessage } from "ai";
import { chatModel } from "@/lib/ai/provider";
import { tools } from "@/lib/ai/tools";
import { phoneContext } from "@/lib/context/phone-context";
import { requestContext } from "@/lib/context/request-context";

const SYSTEM_PROMPT = `
Eres un asistente de pedidos para vendedores de distribuidoras. Sé amable, colaborativo y usa 1–3 emojis cuando ayuden (sin exagerar). 😊🧾

Entrada típica: "Cliente: items". Ej.: "Supermercado Don Pepe: 10 kg queso la serenisima".

Flujo:
1) Valida el CLIENTE: llamá a listarClientes (podés filtrar por el nombre). Si no existe, informá claramente: "No encontré el cliente <nombre>." y sugerí los más parecidos.
2) Identificá productos y cantidades y consultá stock de TODOS con consultarStock.
3) Si hay datos suficientes, creá ORDEN BORRADOR con crearOrdenBorrador.
4) Respondé con un resumen amigable, por ejemplo:
"🧾 Pedido a <cliente>\n- <cantidad> × <producto> (<sku>) — stock: <disp>\n💰 Total estimado: $<total>\n🆔 Orden borrador: <orderId>\n¿Querés confirmarlo? (sí/no)"
5) Si el usuario confirma ("sí", "ok", "confirmar"), llamá a confirmarOrden y reportá: "✅ Pedido confirmado: <orderId>". Incluí el detalle por ítem en líneas: "- <cantidad> × <producto> = $<lineTotal>" y el total final.

Cross-sell (opcional y breve): podés ofrecer productos con sugerirProductos (expiran pronto o son habituales del cliente) como lista corta de 1–3 ítems con razón.

Guías:
- Si faltan datos (cliente o cantidades), pedí lo mínimo con tono colaborativo y agregá ejemplos cortos.
- No inventes SKUs; si no encontrás el producto, ofrecé alternativas del stock.
- Mantené respuestas breves, claras y con 1–3 emojis máximo.
`;

const sessionMessages = new Map<string, ModelMessage[]>();

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

function sanitizeHistory(msgs: ModelMessage[]): ModelMessage[] {
  const out: ModelMessage[] = [];
  for (const m of msgs) {
    if (m.role !== "user" && m.role !== "assistant") continue;
    const text = extractTextContent(m.content as unknown);
    if (!text) continue;
    out.push({ role: m.role, content: text });
  }
  return out;
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

  // Set phone number in context for AI tools to access
  phoneContext.setPhoneNumber(phoneNumber, phoneNumber);

  // Run the entire agent execution within request context
  return requestContext.run(phoneNumber, async () => {
    try {
      const prior = sessionMessages.get(phoneNumber) ?? [];
      if (prior.length === 0) {
        setTimeout(
          () => {
            sessionMessages.delete(phoneNumber);
          },
          60 * 60 * 1000 * 6,
        ); // 6h
      }
      const msgs = sanitizeHistory(prior);
      msgs.push({ role: "user", content: trimmedText });

      const { response } = await generateText({
        model: chatModel,
        system: SYSTEM_PROMPT,
        messages: msgs,
        tools,
        stopWhen: stepCountIs(8),
        onStepFinish: ({
          text,
          toolResults,
          toolCalls,
          finishReason,
          usage,
        }) => {
          console.log("Step finished:", {
            text: JSON.stringify(text),
            toolResults: JSON.stringify(toolResults),
            toolCalls: JSON.stringify(toolCalls),
            finishReason: JSON.stringify(finishReason),
            usage: JSON.stringify(usage),
          });
        },
      });

      const sessionArr = sanitizeHistory(
        sessionMessages.get(phoneNumber) ?? [],
      );
      sessionArr.push({ role: "user", content: trimmedText });
      const last = response.messages[response.messages.length - 1];
      const assistantText = extractTextContent(last?.content as unknown) || "";
      if (assistantText) {
        sessionArr.push({ role: "assistant", content: assistantText });
      }
      if (sessionArr.length > 12) {
        sessionArr.splice(0, sessionArr.length - 12);
      }
      sessionMessages.set(phoneNumber, sessionArr);

      return assistantText || "Entendido.";
    } finally {
      // Clear phone number from context after processing
      phoneContext.clearPhoneNumber(phoneNumber);
    }
  });
}
