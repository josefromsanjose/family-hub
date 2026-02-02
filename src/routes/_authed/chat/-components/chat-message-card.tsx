import type { MessagePart, UIMessage } from "@tanstack/ai";
import { MarkdownContent } from "./markdown-content";

const isVisiblePart = (part: MessagePart) =>
  part.type === "text" || part.type === "thinking";

const renderPart = (part: MessagePart) => {
  if (part.type === "text") {
    return <MarkdownContent content={part.content} />;
  }
  if (part.type === "thinking") {
    return (
      <div className="flex gap-2 text-xs italic text-muted-foreground">
        <span aria-hidden="true">💭</span>
        <MarkdownContent
          content={part.content}
          className="text-xs italic text-muted-foreground"
        />
      </div>
    );
  }
  return null;
};

type ChatMessageCardProps = {
  message: UIMessage;
};

export function ChatMessageCard({ message }: ChatMessageCardProps) {
  const visibleParts = message.parts.filter(isVisiblePart);
  if (visibleParts.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {message.role === "user" ? "You" : "Agent"}
      </div>
      <div className="rounded-md border bg-background p-3 text-sm text-foreground">
        <div className="space-y-2">
          {visibleParts.map((part, index) => (
            <div key={`${message.id}-${index}`}>{renderPart(part)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
