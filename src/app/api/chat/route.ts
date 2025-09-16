import { streamText, UIMessage, convertToModelMessages, stepCountIs } from "ai";
import { chatModel } from "@/lib/ai/provider";
import { tools } from "@/lib/ai/tools";
import { phoneContext } from "@/lib/context/phone-context";
import { requestContext } from "@/lib/context/request-context";

export const maxDuration = 30;

const SYSTEM_PROMPT = `
Eres un asistente de pedidos para vendedores de distribuidoras. Sé amable, colaborativo y usa 1–3 emojis cuando ayuden (sin exagerar). 😊🧾

Entrada típica: "Cliente: items". Ej.: "Supermercado Don Pepe: 10 kg queso la serenisima".

Flujo:
1) Valida el CLIENTE: llamá a listarClientes (podés filtrar por el nombre). Si no existe, informá claramente: "No encontré el cliente <nombre>." y sugerí los más parecidos.
2) Identificá productos y cantidades y consultá stock de TODOS con consultarStock.
3) Si hay datos suficientes, creá ORDEN BORRADOR con crearOrden (o equivalente en herramientas).
4) ANTES de cerrar el resumen del borrador, RECOMENDÁ POSITIVAMENTE entre 1–3 productos adicionales con sugerirProductos para ayudar a vender más (beneficia la comisión del vendedor y las ventas de la distribuidora). Indicá motivo breve ("expira pronto"/"habitual"), cantidad sugerida y precio.
5) Respondé con un resumen amigable, por ejemplo:
"🧾 Pedido a <cliente>\n- <cantidad> × <producto> (<sku>) — stock: <disp>\n➕ Sugerencias: <n> ítems (ej.: <sku> <nombre> × <qty> — $<precio>)\n💰 Total estimado: $<total>\n🆔 Orden borrador: <orderId>\n¿Querés confirmarlo? (sí/no)"
6) Si el usuario confirma ("sí", "ok", "confirmar"), llamá a confirmarOrden y reportá: "✅ Pedido confirmado: <orderId>". Incluí el detalle por ítem en líneas: "- <cantidad> × <producto> = $<lineTotal>" y el total final.

Guías:
- La recomendación NO es opcional: siempre ofrecé 1–3 productos positivos si hay stock.
- Si faltan datos (cliente o cantidades), pedí lo mínimo con tono colaborativo y agregá ejemplos cortos.
- No inventes SKUs; si no encontrás el producto, ofrecé alternativas del stock.
- Mantené respuestas breves, claras y con 1–3 emojis máximo.
`;

export async function POST(req: Request) {
  const { messages, phone }: { messages: UIMessage[]; phone?: string } =
    await req.json();

  const phoneNumber = phone || "541133837591";

  return await requestContext.run(phoneNumber, async () => {
    phoneContext.setPhoneNumber(phoneNumber, phoneNumber);
    const result = streamText({
      model: chatModel,
      messages: convertToModelMessages(messages),
      tools,
      system: SYSTEM_PROMPT,
      stopWhen: stepCountIs(8),
    });

    return result.toUIMessageStreamResponse();
  });
}
