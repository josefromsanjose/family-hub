import type { UIMessage } from "@tanstack/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChatComposer } from "./chat-composer";
import { ChatError } from "./chat-error";
import { ChatThread } from "./chat-thread";

type ChatPanelProps = {
  messages: UIMessage[];
  input: string;
  isLoading: boolean;
  error?: Error;
  onInputChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function ChatPanel({
  messages,
  input,
  isLoading,
  error,
  onInputChange,
  onSubmit,
}: ChatPanelProps) {
  return (
    <div className="flex h-full flex-col space-y-4">
    
        <ChatThread messages={messages} isLoading={isLoading} />
        <ChatComposer
          input={input}
          isLoading={isLoading}
          onInputChange={onInputChange}
          onSubmit={onSubmit}
        />
        <ChatError error={error} />
    </div>
  );
}
