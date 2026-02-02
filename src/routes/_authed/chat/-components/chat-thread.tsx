import type { UIMessage } from "@tanstack/ai";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessageCard } from "./chat-message-card";

type ChatThreadProps = {
  messages: UIMessage[];
  isLoading: boolean;
};

export function ChatThread({ messages, isLoading }: ChatThreadProps) {
  return (
    <ScrollArea className="min-h-0 flex-1 rounded-md border bg-muted/30 p-4">
      <div className="flex flex-col gap-4">
        {messages.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Ask the agent a question to get started.
          </p>
        ) : null}
        {messages.map((message) => (
          <ChatMessageCard key={message.id} message={message} />
        ))}
        {isLoading ? (
          <div className="rounded-md border bg-background p-3 text-sm text-muted-foreground">
            Agent is thinking...
          </div>
        ) : null}
      </div>
    </ScrollArea>
  );
}
