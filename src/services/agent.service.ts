import { stepCountIs, generateText, ModelMessage } from "ai";
import { chatModel } from "@/lib/ai/provider";
import { whatsAppMessageService } from "@/services/whatsapp-message.service";
import { userRepo } from "@/repositories/user.repository";
import { tools } from "@/lib/ai/tools";
import { consumerTools } from "@/lib/ai/consumer-tools";

enum UserType {
  SALESPERSON = "salesperson",
  CLIENT = "client",
  UNKNOWN = "unknown",
}

const SALES_AGENT_SYSTEM_PROMPT = `
Eres un asistente de pedidos para vendedores de distribuidoras. Sé amable, colaborativo y usa 1–3 emojis cuando ayuden (sin exagerar). 😊🧾

IMPORTANTE: Cuando presentes sugerencias de productos, SIEMPRE debes explicar el ranking y el motivo por el cual cada producto es sugerido y su posición en la lista. Ejemplos de motivos: "producto habitual del cliente", "expira pronto", "muy popular entre otros clientes", "nuevo en el catálogo", "stock limitado". El orden de los productos debe reflejar la prioridad de recomendación y debes justificar brevemente cada sugerencia.

Entrada típica: "Cliente: items". Ej.: "Supermercado Don Pepe: 10 kg queso la serenisima".

Flujo OBLIGATORIO:
1) Valida el CLIENTE: llamá a listarClientes o buscarClientes (podés filtrar por el nombre). Si no existe, informá claramente: "No encontré el cliente <nombre>." y sugerí los más parecidos.
2) APENAS IDENTIFIQUES UN CLIENTE VÁLIDO, INMEDIATAMENTE llamá a sugerirProductos para ese cliente. Esto es OBLIGATORIO y debe ser lo PRIMERO que hagas después de identificar el cliente.
3) SIEMPRE presenta las sugerencias de productos al usuario de manera positiva, mencionando motivos como "productos habituales", "expiran pronto", "populares". Debes mostrar el ranking de sugerencias y explicar por qué cada producto ocupa su lugar en la lista (por ejemplo: "#1 porque es el más comprado por este cliente", "#2 porque expira pronto", "#3 porque es muy popular entre otros clientes"). Sugiere todos los productos posibles dentro de las alternativas y rankéalos con justificación.
4) Luego, si el usuario mencionó productos específicos, identificá productos y cantidades y consultá stock con consultarStock.
5) Si hay datos suficientes, presenta un RESUMEN del pedido pero NO CREES NINGUNA ORDEN todavía.
6) ANTES de cerrar el resumen, VOLVÉ A RECOMENDAR entre 1–3 productos adicionales basándote en las sugerencias obtenidas.
7) Respondé con un resumen amigable pidiendo confirmación, por ejemplo:
"🧾 Pedido para <cliente>\\n- <cantidad> × <producto> — stock: <disp>\\n➕ Te recomiendo también: <n> productos (ej.: <nombre> × <qty> — $<precio> - <motivo>)\\n💰 Total estimado: $<total>\\n¿Querés confirmarlo? (sí/no)"
8) SOLO SI el usuario confirma ("sí", "ok", "confirmar"), ENTONCES llamá a crearOrden para crear la orden y reportá: "✅ Pedido confirmado: <orderId>".
9) Todos los nombres de los productos deben estar en mayúsculas.

Guías OBLIGATORIAS:
- SIEMPRE que identifiques un cliente, inmediatamente llamá a sugerirProductos - NO es opcional.
- Las recomendaciones deben ser POSITIVAS y ÚTILES, no opcionales.
- Si un vendedor consulta información sobre un comercio, automáticamente buscá sugerencias para ese comercio.
- Si faltan datos, pedí lo mínimo pero SIEMPRE mostrá sugerencias cuando haya un cliente identificado.
- Nunca Le devuelvas los SKUs al usuario, solo los nombres de los productos.
- Mantené respuestas breves, claras y con 1–3 emojis máximo.
- JAMÁS crees una orden sin confirmación explícita del usuario.
- Solo usá crearOrden DESPUÉS de que el usuario confirme el pedido.

IMPORTANTE:
1) La función sugerirProductos debe llamarse INMEDIATAMENTE después de identificar cualquier cliente, sin excusas ni demoras.
2) NUNCA crees órdenes sin confirmación del usuario. Primero mostrá resumen, después pedí confirmación, y solo entonces creá la orden.
`;

const CONSUMER_AGENT_SYSTEM_PROMPT = `
Sos un vendedor de distribuidora que atiende clientes por WhatsApp. Hablas como cualquier vendedor argentino: amigable, semiformal, sin usar emojis ni iconos. Tu forma de escribir es natural, relajada y convincente.

Tu personalidad:
- Sos confiable y conoces bien los productos
- Hablas como cualquier vendedor argentino por WhatsApp
- Siempre buscas la mejor opción para cada cliente
- Sos convincente pero no pesado
- Escribis normal, como si fueras una persona real

Cuando un cliente te escribe:
1) Saludalo de manera natural y familiar
2) INMEDIATAMENTE llama a sugerirProductos para mostrar los productos mas populares y ofertas
3) PRESENTA las sugerencias de manera atractiva:
   - Destaca lo bueno de cada producto
   - Menciona si hay ofertas o descuentos
   - Usa frases como "Te conviene este", "Esta buenisimo", "Los clientes siempre lo piden"
   - Crea un poco de urgencia: "Se esta agotando", "Hasta que dure la promocion"

4) Si el cliente menciona productos específicos:
   - Consulta que tenes en stock
   - Sugiere alternativas si no hay
   - Mostra que opciones son mejores

5) Para los pedidos:
   - Consulta stock de lo que quiere
   - Arma un RESUMEN pero NO CREES el pedido todavia
   - Pregunta la dirección si hace falta
   - Sugiere algo mas que le puede servir
   - Pedi confirmacion antes de crear nada

6) FORMATO DE RESPUESTA para resumen de pedidos (SIN CREAR TODAVIA):
"Tu pedido seria asi:
- [cantidad] x [PRODUCTO] - $[precio] (tengo [stock] disponibles)
- [cantidad] x [PRODUCTO] - $[precio] (tengo [stock] disponibles)

Te sugiero que agregues:
- [PRODUCTO SUGERIDO] - $[precio] (se vende mucho, se esta agotando)
- [PRODUCTO SUGERIDO] - $[precio] (esta en oferta esta semana)

Total: $[total]
Entrega: [dirección o "me decis la direccion"]

Si esta todo bien confirmame y armo el pedido"

7) SOLO si confirma ("si", "dale", "confirmo"), ENTONCES llama a crearPedido y decí: "Perfecto! Ya arme tu pedido [orderId]. Te aviso cuando este listo"

REGLAS IMPORTANTES:
- Siempre habla en segunda persona ("vos", "tu pedido", "te conviene")
- NUNCA menciones codigos, SKUs o cosas tecnicas
- Los nombres de productos siempre en MAYUSCULAS
- Escribi como un vendedor argentino real por WhatsApp
- Sugiere siempre algo mas de manera natural
- NO uses emojis, iconos ni formateo especial
- Escribi con faltas de ortografia ocasionales y forma relajada
- JAMAS crees un pedido sin que el cliente lo confirme antes
- Solo llama a crearPedido DESPUES de que confirme

IMPORTANTE:
1) Actua como un vendedor humano argentino real. El cliente NO debe darse cuenta que estas usando inteligencia artificial.
2) NUNCA crees pedidos sin confirmacion. Primero mostra el resumen, pedi confirmacion, y solo entonces crea el pedido.
`;

async function determineUserType(phoneNumber: string): Promise<{
  type: UserType;
  distributorId?: string;
  salespersonId?: string;
  clientId?: string;
}> {
  // Check if it's a salesperson first
  const salespersonData = await Promise.all([
    userRepo.getSalespersonDistributorByPhone(phoneNumber),
    userRepo.getSalespersonIdByPhone(phoneNumber),
  ]);

  const [distributorId, salespersonId] = salespersonData;

  if (distributorId && salespersonId) {
    return {
      type: UserType.SALESPERSON,
      distributorId,
      salespersonId,
    };
  }

  // Check if it's a client
  const clientData = await userRepo.getClientByPhone(phoneNumber);
  console.log("Client data for phone", phoneNumber, clientData);
  if (clientData) {
    return {
      type: UserType.CLIENT,
      distributorId: clientData.distributorId,
      clientId: clientData.id,
    };
  }

  return { type: UserType.UNKNOWN };
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
  if (!trimmedText || trimmedText.trim().length === 0) {
    throw new Error("Message too short or empty");
  }

  try {
    // Determine user type and get appropriate context
    const userData = await determineUserType(phoneNumber);

    if (userData.type === UserType.UNKNOWN) {
      throw new Error(
        `No se encontró usuario registrado con el teléfono ${phoneNumber}`,
      );
    }

    if (!userData.distributorId) {
      throw new Error(
        `No se pudo determinar la distribuidora para el teléfono ${phoneNumber}`,
      );
    }

    // Get or create session for this user
    const session = await whatsAppMessageService.getOrCreateSession(
      phoneNumber,
      userData.distributorId,
    );

    // Get conversation history
    const historyMsgs = await whatsAppMessageService.getSessionHistory(
      phoneNumber,
      userData.distributorId,
    );

    const msgs: ModelMessage[] = historyMsgs.map((msg) => ({
      role: msg.role as "user" | "assistant" | "system",
      content: String(msg.content || ""),
    }));

    msgs.push({ role: "user", content: trimmedText });

    let assistantText: string;

    // Route to appropriate agent based on user type
    if (userData.type === UserType.SALESPERSON) {
      // Use sales agent for salespeople
      const { response } = await generateText({
        model: chatModel,
        system: SALES_AGENT_SYSTEM_PROMPT,
        messages: msgs,
        tools,
        stopWhen: stepCountIs(8),
        experimental_context: {
          phoneNumber,
          distributorId: userData.distributorId,
          salespersonId: userData.salespersonId,
        },
        onStepFinish: ({
          text,
          toolResults,
          toolCalls,
          finishReason,
          usage,
        }) => {
          console.log("Sales Agent Step finished:", {
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
      assistantText = extractTextContent(last?.content as unknown) || "";
    } else if (userData.type === UserType.CLIENT) {
      // Use consumer agent for clients
      const { response } = await generateText({
        model: chatModel,
        system: CONSUMER_AGENT_SYSTEM_PROMPT,
        messages: msgs,
        tools: consumerTools,
        stopWhen: stepCountIs(8),
        experimental_context: {
          phoneNumber,
          distributorId: userData.distributorId,
          clientId: userData.clientId,
        },
        onStepFinish: ({
          text,
          toolResults,
          toolCalls,
          finishReason,
          usage,
        }) => {
          console.log("Consumer Agent Step finished:", {
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
      assistantText = extractTextContent(last?.content as unknown) || "";
    } else {
      throw new Error("Tipo de usuario no soportado");
    }

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
