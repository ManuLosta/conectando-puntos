"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

type Msg = { role: "user" | "agent"; text: string };

export default function AgentPlaygroundPage() {
  const [sessionId, setSessionId] = useState("");
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved =
      typeof window !== "undefined"
        ? localStorage.getItem("agentSessionId")
        : null;
    if (saved) {
      setSessionId(saved);
    } else {
      const id = `play-${Math.random().toString(36).slice(2, 8)}`;
      setSessionId(id);
      if (typeof window !== "undefined")
        localStorage.setItem("agentSessionId", id);
    }
  }, []);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const example = useMemo(
    () => "Supermercado Don Pepe: 10 kg de queso la serenisima",
    [],
  );

  async function send() {
    const text = input.trim();
    if (!text || busy) return;
    setBusy(true);
    setMessages((m) => [...m, { role: "user", text }]);
    setInput("");
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, text }),
      });
      const data = (await res.json()) as { reply?: string; error?: string };
      const reply = data.reply ?? data.error ?? "(sin respuesta)";
      setMessages((m) => [...m, { role: "agent", text: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "agent", text: "Error llamando al agente" },
      ]);
    } finally {
      setBusy(false);
    }
  }

  function handleKey(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void send();
    }
  }

  return (
    <div className="mx-auto max-w-3xl p-4">
      <Card>
        <CardHeader>
          <CardTitle>Playground del Agente</CardTitle>
          <p className="text-sm text-gray-600">
            Proba sin WhatsApp. Formato: <code>Cliente: items</code>. Ej.:{" "}
            {example}
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2 text-sm">
            <Label className="min-w-[52px]">Sesión</Label>
            <Input
              value={sessionId}
              onChange={(e) => {
                setSessionId(e.target.value);
                if (typeof window !== "undefined")
                  localStorage.setItem("agentSessionId", e.target.value);
              }}
            />
            <Button
              variant="outline"
              onClick={() => {
                const id = `play-${Math.random().toString(36).slice(2, 8)}`;
                setSessionId(id);
                if (typeof window !== "undefined")
                  localStorage.setItem("agentSessionId", id);
              }}
            >
              Nueva sesión
            </Button>
          </div>

          <div className="h-[50vh] overflow-auto rounded-md border bg-white">
            {messages.length === 0 && (
              <div className="p-3 text-sm text-gray-500">
                Empezá con: <span className="font-mono">{example}</span>
              </div>
            )}
            <div className="space-y-3 p-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={m.role === "user" ? "text-right" : "text-left"}
                >
                  <div
                    className={
                      "inline-block max-w-[90%] whitespace-pre-wrap rounded-md px-3 py-2 " +
                      (m.role === "user"
                        ? "bg-blue-600 text-white"
                        : "border bg-gray-50 text-gray-900")
                    }
                  >
                    {m.text}
                  </div>
                </div>
              ))}
            </div>
            <div ref={endRef} />
          </div>
        </CardContent>
        <CardFooter className="gap-2">
          <Textarea
            className="min-h-[60px] flex-1"
            placeholder={example}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
          />
          <Button onClick={send} disabled={busy || !input.trim()}>
            {busy ? "Enviando..." : "Enviar"}
          </Button>
        </CardFooter>
      </Card>

      <p className="mt-2 text-xs text-gray-500">
        Consejos: respondé &quot;sí&quot; para confirmar el último borrador, o
        &quot;cancelar&quot; si no querés continuar.
      </p>
    </div>
  );
}
