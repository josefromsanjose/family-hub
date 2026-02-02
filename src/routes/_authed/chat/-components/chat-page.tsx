import { useState } from "react";
import { useChat, fetchServerSentEvents } from "@tanstack/ai-react";
import { FullHeightContainer } from "@/components/FullHeightContainer";
import { getChatClientTools } from "@/server/ai/tools/client";
import { ChatPanel } from "./chat-panel";
import { ToolPanel } from "./tool-panel";

export function ChatPage() {
  const [input, setInput] = useState("");
  const tools = getChatClientTools();

  const { messages, sendMessage, isLoading, error } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
    tools,
  });

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) {
      return;
    }
    setInput("");
    void sendMessage(trimmed);
  };

  return (
    <FullHeightContainer className="mx-auto w-full max-w-6xl py-6">
      <div className="flex h-full w-full flex-col gap-6 lg:flex-row">
        <div className="w-full lg:flex-1">
          <ChatPanel
            messages={messages}
            input={input}
            isLoading={isLoading}
            error={error}
            onInputChange={setInput}
            onSubmit={handleSubmit}
          />
        </div>
        <ToolPanel messages={messages} />
      </div>
    </FullHeightContainer>
  );
}
