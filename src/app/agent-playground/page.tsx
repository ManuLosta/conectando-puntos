"use client";

import { useState, Fragment } from "react";
import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputBody,
  type PromptInputMessage,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
} from "@/components/ai-elements/prompt-input";
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

export default function AgentPlaygroundPage() {
  const [input, setInput] = useState("");
  const { messages, sendMessage, status } = useChat();

  const handleSubmit = (message: PromptInputMessage) => {
    const hasText = Boolean(message.text);
    const hasAttachments = Boolean(message.files?.length);

    if (!(hasText || hasAttachments)) {
      return;
    }

    sendMessage({
      text: message.text || "Sent with attachments",
    });
    setInput("");
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative size-full h-full">
      <div className="flex flex-col h-full">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">Playground del Agente</h1>
        </div>

        <Conversation className="h-full">
          <ConversationContent>
            {messages.map((message) => (
              <div key={message.id}>
                {message.parts.map((part, i) => {
                  switch (part.type) {
                    case "text":
                      return (
                        <Fragment key={`${message.id}-${i}`}>
                          <Message from={message.role as "user" | "assistant"}>
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
                          <div className="my-2" key={`${message.id}-tool-${i}`}>
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
        </Conversation>

        <PromptInput onSubmit={handleSubmit} className="mt-4" multiple>
          <PromptInputBody>
            <PromptInputTextarea
              onChange={(e) => setInput(e.target.value)}
              value={input}
              placeholder="Escribe tu mensaje aquí"
            />
          </PromptInputBody>
          <PromptInputToolbar>
            <PromptInputSubmit
              disabled={!input && status !== "submitted"}
              status={status}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
}
