import { WhatsappService } from "@/services/whatsapp.service";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN!;
const whatsapp = new WhatsappService();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return new Response(challenge ?? "", { status: 200 });
  }
  return new Response("Forbidden", { status: 403 });
}

export async function POST(req: Request) {
  const raw = await req.text();
  const sigHeader = req.headers.get("x-hub-signature-256");
  if (!whatsapp.verifySignature(raw, sigHeader)) {
    return new Response("Invalid signature", { status: 401 });
  }

  const body = JSON.parse(raw);

  try {
    await whatsapp.handleWebhook(body);

    return new Response("ok", { status: 200 });
  } catch (e) {
    console.error(e);
    return new Response("ok", { status: 200 });
  }
}
