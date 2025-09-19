"use client";

import { useState, Fragment, useEffect, useRef } from "react";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { ArrowUpIcon, Loader2Icon, UserIcon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Response } from "@/components/ai-elements/response";
import { Loader } from "@/components/ai-elements/loader";
import {
  Tool,
  ToolContent,
  ToolHeader,
  ToolInput,
  ToolOutput,
} from "@/components/ai-elements/tool";
import { ToolUIPart } from "ai";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from "@/components/ui/breadcrumb";
import { Separator } from "@radix-ui/react-separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface Salesperson {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  territory: string | null;
  distributorId: string;
}

export default function AgentPlaygroundPage() {
  const [input, setInput] = useState("");
  const [selectedSalesperson, setSelectedSalesperson] =
    useState<Salesperson | null>(null);
  const [salespeople, setSalespeople] = useState<Salesperson[]>([]);
  const [loading, setLoading] = useState(true);
  const endRef = useRef<HTMLDivElement | null>(null);

  // Fetch salespeople on component mount
  useEffect(() => {
    const fetchSalespeople = async () => {
      try {
        const response = await fetch("/api/salespeople");
        if (response.ok) {
          const data = await response.json();
          setSalespeople(data);
          // Set the first salesperson as default if available
          if (data.length > 0) {
            setSelectedSalesperson(data[0]);
          }
        } else {
          console.error(
            "Failed to fetch salespeople:",
            response.status,
            response.statusText,
          );
        }
      } catch (error) {
        console.error("Error fetching salespeople:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSalespeople();
  }, []);

  const { messages, sendMessage, status, error } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
    }),
  });

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text || !selectedSalesperson) return;
    sendMessage(
      { text },
      {
        body: {
          phone: selectedSalesperson.phone,
        },
      },
    );
    setInput("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = input.trim();
      if (!text || !selectedSalesperson) return;
      sendMessage(
        { text },
        {
          body: {
            phone: selectedSalesperson.phone,
          },
        },
      );
      setInput("");
    }
  }

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-2 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>Agente de Ventas</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
        <div className="flex items-center gap-4 ml-auto px-4">
          <div className="flex items-center gap-2">
            <Label
              htmlFor="salesperson-select"
              className="text-sm font-medium flex items-center gap-1"
            >
              <UserIcon className="h-4 w-4" />
              Vendedor:
            </Label>
            <Select
              value={selectedSalesperson?.id || ""}
              onValueChange={(value) => {
                const salesperson = salespeople.find((s) => s.id === value);
                setSelectedSalesperson(salesperson || null);
              }}
              disabled={loading}
            >
              <SelectTrigger id="salesperson-select" className="w-[200px]">
                <SelectValue
                  placeholder={loading ? "Cargando..." : "Seleccionar vendedor"}
                />
              </SelectTrigger>
              <SelectContent>
                {salespeople.map((salesperson) => (
                  <SelectItem key={salesperson.id} value={salesperson.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{salesperson.name}</span>
                      {salesperson.phone && (
                        <span className="text-xs text-muted-foreground">
                          {salesperson.phone}
                        </span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </header>
      <div
        className="flex-1 min-h-0 overflow-y-auto max-h-[calc(100vh-8rem)]"
        id="scroll-container"
      >
        <div className="max-w-3xl mx-auto pb-16">
          {!selectedSalesperson && !loading && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-800 text-sm">
                ⚠️ Por favor selecciona un vendedor para comenzar a chatear con
                el agente.
              </p>
            </div>
          )}
          {selectedSalesperson && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-blue-800 text-sm flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Chateando como: <strong>{selectedSalesperson.name}</strong>
                {selectedSalesperson.phone && (
                  <span className="text-blue-600">
                    ({selectedSalesperson.phone})
                  </span>
                )}
              </p>
            </div>
          )}
          {status === "error" && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">
                ❌ Error:{" "}
                {error?.message ||
                  "Ocurrió un error al enviar el mensaje. Por favor, selecciona un vendedor válido."}
              </p>
            </div>
          )}
          <Conversation className="flex-1 min-h-0">
            <ConversationContent>
              {messages.map((message) => (
                <div key={message.id}>
                  {message.parts.map((part, i) => {
                    switch (part.type) {
                      case "text":
                        return (
                          <Fragment key={`${message.id}-${i}`}>
                            <Message
                              from={message.role as "user" | "assistant"}
                            >
                              <MessageContent>
                                <Response>{part.text}</Response>
                              </MessageContent>
                            </Message>
                          </Fragment>
                        );
                      default:
                        if (part.type?.startsWith("tool-")) {
                          const toolType = part.type as `tool-${string}`;
                          const state = (part as ToolUIPart).state as
                            | "input-streaming"
                            | "input-available"
                            | "output-available"
                            | "output-error";
                          const input = (part as ToolUIPart).input;
                          const output = (part as ToolUIPart).output;
                          const errorText = (part as ToolUIPart).errorText as
                            | string
                            | null
                            | undefined;

                          return (
                            <div
                              className="my-2"
                              key={`${message.id}-tool-${i}`}
                            >
                              <Tool
                                defaultOpen={
                                  state === "output-available" ||
                                  state === "output-error"
                                }
                              >
                                <ToolHeader type={toolType} state={state} />
                                <ToolContent>
                                  {typeof input !== "undefined" && (
                                    <ToolInput input={input} />
                                  )}
                                  <ToolOutput
                                    errorText={errorText ?? undefined}
                                    output={output}
                                  />
                                </ToolContent>
                              </Tool>
                            </div>
                          );
                        }
                        return null;
                    }
                  })}
                </div>
              ))}
              {status === "submitted" && <Loader />}
            </ConversationContent>
            <div ref={endRef} />
          </Conversation>

          <form
            onSubmit={onSubmit}
            className="mt-4 fixed bottom-0 z-10 w-full pb-4 max-w-3xl px-4"
          >
            <div className="flex items-center gap-2 rounded-full border bg-background px-3 py-2 shadow-sm transition-shadow focus-within:border-transparent focus-within:ring-2 focus-within:ring-primary focus-within:shadow-md">
              <textarea
                className="flex-1 focus:outline-none shadow-none max-h-40 resize-none border-0 bg-transparent p-0 focus-visible:ring-0 p-2 disabled:opacity-50 disabled:cursor-not-allowed"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={
                  selectedSalesperson
                    ? "Escribe tu mensaje aquí"
                    : "Selecciona un vendedor para comenzar"
                }
                rows={1}
                disabled={!selectedSalesperson || status === "submitted"}
              />
              <button
                className="rounded-full p-2 bg-primary text-primary-foreground disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={
                  !input.trim() ||
                  status === "submitted" ||
                  !selectedSalesperson
                }
              >
                {status === "submitted" ? (
                  <Loader2Icon className="size-4 animate-spin" />
                ) : (
                  <ArrowUpIcon className="size-4" />
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
