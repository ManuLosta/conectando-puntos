import { NextResponse } from "next/server";
import { runAgent } from "@/services/agent";

export async function POST(req: Request) {
  try {
    const { phoneNumber = "+54 11 3456-7890", text } = (await req.json()) as {
      phoneNumber?: string;
      text: string;
    };
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const reply = await runAgent({ phoneNumber, userText: text });
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("/api/agent error", err);
    return NextResponse.json({ error: "Agent error" }, { status: 500 });
  }
}
