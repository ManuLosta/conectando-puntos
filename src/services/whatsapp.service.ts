import crypto from "crypto";
import { WhatsAppMessage, WhatsAppWebhookBody } from "@/types/whatsapp";

const WHATSAPP_TOKEN = process.env.WHATSAPP_TOKEN!;
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!;
const API_VERSION = process.env.WHATSAPP_API_VERSION || "v23.0";
const APP_SECRET = process.env.WHATSAPP_APP_SECRET!;

export class WhatsappService {
  constructor() {}

  async sendMessage(to: string, message: string) {
    const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;
    const payload = this.createWhatsappMessage(
      this.normalizePhoneNumber(to),
      message,
    );

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`WhatsApp API error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  async markRead(messageId: string) {
    const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      status: "read",
      message_id: messageId,
    };
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  async typingOn(to: string) {
    const url = `https://graph.facebook.com/${API_VERSION}/${PHONE_NUMBER_ID}/messages`;
    const payload = {
      messaging_product: "whatsapp",
      to,
      type: "typing",
      typing: { status: "typing" },
    };
    await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${WHATSAPP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  }

  extractMessage(body: WhatsAppWebhookBody): WhatsAppMessage | null {
    return body.entry?.[0]?.changes?.[0]?.value?.messages?.[0] ?? null;
  }

  getPhoneNumberFromMessage(message: WhatsAppMessage) {
    const phoneNumber = message.from;
    if (
      process.env.NODE_ENV !== "production" &&
      phoneNumber.startsWith("54911")
    ) {
      return "5411" + phoneNumber.slice(5);
    }
    return phoneNumber;
  }

  normalizePhoneNumber(phoneNumber: string) {
    if (
      process.env.NODE_ENV !== "production" &&
      phoneNumber.startsWith("54911")
    ) {
      return "5411" + phoneNumber.slice(5);
    }
    return phoneNumber;
  }

  verifySignature(rawBody: string, signatureHeader: string | null): boolean {
    if (!signatureHeader) return false;
    const expected =
      "sha256=" +
      crypto.createHmac("sha256", APP_SECRET).update(rawBody).digest("hex");
    return signatureHeader === expected;
  }

  async handleWebhook(body: WhatsAppWebhookBody) {
    const entry = body?.entry?.[0];
    const change = entry?.changes?.[0];
    const value = change?.value;
    const msg: WhatsAppMessage | undefined = value?.messages?.[0];
    if (!msg) return;

    const from = msg.from;
    const text = msg.text?.body || "";
    const messageId = msg.id as string | undefined;

    if (messageId) await this.markRead(messageId);
    await this.typingOn(from);

    const reply = await this.generateReply(text, from);
    await this.sendMessage(from, reply);
  }

  async generateReply(userText: string, _from: string) {
    return `You said: "${userText}". How can I help further?`;
  }

  private createWhatsappMessage(to: string, body: string) {
    return {
      messaging_product: "whatsapp",
      to,
      type: "text",
      text: {
        body,
      },
    };
  }
}
