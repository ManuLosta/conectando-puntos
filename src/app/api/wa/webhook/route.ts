import { after, NextResponse } from "next/server";
import {
  WhatsAppMessage,
  WhatsAppWebhookBody,
  WhatsAppFormattedResponse,
} from "@/types/whatsapp";
import { runAgent } from "@/services/agent.service";
import { WhatsAppFormattedMessage } from "@/services/whatsapp-formatter.service";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const API_VERSION = process.env.WHATSAPP_API_VERSION || "v23.0";
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;

const processedMessages = new Set<string>();

function normalizePhoneNumber(phoneNumber: string): string {
  if (phoneNumber.startsWith("54911")) {
    return "5411" + phoneNumber.slice(5);
  }
  return phoneNumber;
}

function createWhatsAppResponse(
  to: string,
  formattedMessage: WhatsAppFormattedMessage,
): WhatsAppFormattedResponse {
  if (formattedMessage.interactive) {
    return {
      messaging_product: "whatsapp",
      to: to,
      type: "interactive",
      interactive: formattedMessage.interactive,
    };
  }

  return {
    messaging_product: "whatsapp",
    to: to,
    type: "text",
    text: { body: formattedMessage.text || "" },
  };
}

async function markReadWithTyping(messageId: string): Promise<void> {
  const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;
  const payload = {
    messaging_product: "whatsapp",
    status: "read",
    message_id: messageId,
    typing_indicator: {
      type: "text",
    },
  } as const;

  try {
    const resp = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const txt = await resp.text();
      console.error(`markReadWithTyping failed: ${resp.status} - ${txt}`);
    }
  } catch (err) {
    console.error("markReadWithTyping error:", err);
  }
}

async function sendWhatsAppMessage(
  to: string,
  formattedMessage: WhatsAppFormattedMessage,
): Promise<unknown> {
  const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(createWhatsAppResponse(to, formattedMessage)),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API error: ${response.status} - ${errorText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error sending WhatsApp message:", error);
    throw error;
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const mode = url.searchParams.get("hub.mode");
  const challenge = url.searchParams.get("hub.challenge");
  const verifyToken = url.searchParams.get("hub.verify_token");

  if (mode === "subscribe" && verifyToken === VERIFY_TOKEN) {
    console.log("WhatsApp webhook verified successfully");
    return new Response(challenge, { status: 200 });
  }

  console.error("WhatsApp webhook verification failed");
  return new Response("Verification failed", { status: 400 });
}

export async function POST(request: Request) {
  let body: WhatsAppWebhookBody | undefined;
  try {
    body = await request.json();
  } catch (err) {
    console.error("Invalid JSON body in webhook:", err);
    return NextResponse.json(
      { status: "IGNORED_INVALID_BODY" },
      { status: 200 },
    );
  }

  // ACK inmediato
  const ack = NextResponse.json({ status: "RECEIVED" });

  // Trabajo post-respuesta garantizado por Next.js
  after(async () => {
    try {
      const messages = extractMessages(body as WhatsAppWebhookBody);
      for (const message of messages) {
        await processTextMessage(message);
      }
    } catch (err) {
      console.error("Async processing error:", err);
    }
  });

  return ack;
}

function extractMessages(body: WhatsAppWebhookBody): WhatsAppMessage[] {
  const messages: WhatsAppMessage[] = [];

  for (const entry of body.entry ?? []) {
    for (const change of entry.changes ?? []) {
      messages.push(...(change.value?.messages ?? []));
    }
  }

  return messages;
}

async function processTextMessage(message: WhatsAppMessage): Promise<void> {
  // Handle interactive message responses
  let userText = "";
  let interactionId = "";

  if (message.type === "interactive") {
    if (message.interactive?.button_reply) {
      userText = message.interactive.button_reply.title;
      interactionId = message.interactive.button_reply.id;
    } else if (message.interactive?.list_reply) {
      userText = message.interactive.list_reply.title;
      interactionId = message.interactive.list_reply.id;
    }
  } else if (message.type === "text" && message.text?.body) {
    userText = message.text.body.trim();
  }

  if (!message.from || !userText || !message.id) {
    return;
  }

  // Verificar si ya procesamos este mensaje
  if (processedMessages.has(message.id)) {
    console.log(`Message ${message.id} already processed, skipping`);
    return;
  }

  const from = message.from;

  // Validar que el mensaje no esté vacío
  if (!userText || userText.length === 0) {
    console.log(`Empty message from ${from}, skipping`);
    return;
  }

  // Marcar mensaje como procesado
  processedMessages.add(message.id);

  // Limpiar mensajes antiguos para evitar memory leak
  if (processedMessages.size > 1000) {
    const oldestIds = Array.from(processedMessages).slice(0, 100);
    oldestIds.forEach((id) => processedMessages.delete(id));
  }

  const normalizedTo = normalizePhoneNumber(from);

  try {
    // Mark as read and include typing indicator as per Cloud API
    await markReadWithTyping(message.id);

    const responses = await runAgent({
      phoneNumber: normalizedTo,
      userText: userText,
      interactionId: interactionId,
    });

    if (responses && responses.length > 0) {
      // Enviar múltiples mensajes con un pequeño delay entre ellos
      for (let i = 0; i < responses.length; i++) {
        const response = responses[i];
        if (response && (response.text || response.interactive)) {
          await sendWhatsAppMessage(normalizedTo, response);
          console.log(
            `Message ${i + 1}/${responses.length} sent to ${normalizedTo}: ${response.text ? response.text.substring(0, 50) : "Interactive message"}...`,
          );

          // Pequeño delay entre mensajes para evitar rate limiting
          if (i < responses.length - 1) {
            await new Promise((resolve) => setTimeout(resolve, 500));
          }
        }
      }
    } else {
      console.log(`Empty response for message from ${from}, not sending`);
    }
  } catch (error) {
    console.error(`Failed to process message from ${from}:`, error);
    // Remover de procesados en caso de error para permitir reintento
    processedMessages.delete(message.id);
  }
}
