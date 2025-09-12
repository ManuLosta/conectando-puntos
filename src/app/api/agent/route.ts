import { NextResponse } from "next/server";
import { runAgent } from "@/services/agent";

export async function POST(req: Request) {
  try {
    const { sessionId = "playground", text } = (await req.json()) as {
      sessionId?: string;
      text: string;
    };
    if (!text || typeof text !== "string") {
      return NextResponse.json({ error: "Missing text" }, { status: 400 });
    }

    const reply = await runAgent({ sessionId, userText: text });
    return NextResponse.json({ reply });
  } catch (err) {
    console.error("/api/agent error", err);
    return NextResponse.json({ error: "Agent error" }, { status: 500 });
  }
}
