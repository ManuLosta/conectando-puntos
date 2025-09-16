"use client";

import { useState, Fragment, useEffect, useRef } from "react";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import { Button } from "@/components/ui/button";
import { ArrowUpIcon, Loader2Icon } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useChat } from "@ai-sdk/react";
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

export default function AgentPlaygroundPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const text = input.trim();
    if (!text) return;
    sendMessage({ text });
    setInput("");
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const text = input.trim();
      if (!text) return;
      sendMessage({ text });
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
      </header>
      <div
        className="flex-1 min-h-0 overflow-y-auto max-h-[calc(100vh-8rem)]"
        id="scroll-container"
      >
        <div className="max-w-3xl mx-auto pb-16">
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
                className="flex-1 focus:outline-none shadow-none max-h-40 resize-none border-0 bg-transparent p-0 focus-visible:ring-0 p-2"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Escribe tu mensaje aquí"
                rows={1}
              />
              <button
                className="rounded-full p-2 bg-primary text-primary-foreground"
                disabled={!input.trim() || status === "submitted"}
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
