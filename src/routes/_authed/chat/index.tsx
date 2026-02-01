import { useEffect, useMemo, useState } from "react";
import { useChat, fetchServerSentEvents } from "@tanstack/ai-react";
import type {
  MessagePart,
  ToolCallPart,
  UIMessage,
} from "@tanstack/ai";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getChatClientTools } from "@/server/ai/tools/client";

type ChatMessage = {
  id: string;
  role: string;
  parts: MessagePart[];
};

type TaskSummary = {
  id: string;
  title: string;
  completed: boolean;
};

type ListTasksResult = {
  total: number;
  tasks: TaskSummary[];
};

type ToolPanelPayload = {
  toolName: string;
  output: unknown;
};

const isListTasksResult = (value: unknown): value is ListTasksResult => {
  if (!value || typeof value !== "object") {
    return false;
  }
  const candidate = value as ListTasksResult;
  return (
    typeof candidate.total === "number" &&
    Array.isArray(candidate.tasks) &&
    candidate.tasks.every(
      (task) =>
        task &&
        typeof task.id === "string" &&
        typeof task.title === "string" &&
        typeof task.completed === "boolean"
    )
  );
};

const tryParseJson = (content: string): unknown => {
  try {
    return JSON.parse(content) as unknown;
  } catch {
    return null;
  }
};

const getLatestToolOutput = (messages: UIMessage[]): ToolPanelPayload | null => {
  const toolCallsById = new Map<string, ToolCallPart>();
  let latest: ToolPanelPayload | null = null;

  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type === "tool-call") {
        toolCallsById.set(part.id, part);
        if (part.output !== undefined) {
          latest = { toolName: part.name, output: part.output };
        }
      }
    }
  }

  for (const message of messages) {
    for (const part of message.parts) {
      if (part.type === "tool-result") {
        const toolCall = toolCallsById.get(part.toolCallId);
        if (toolCall) {
          const parsed = tryParseJson(part.content);
          latest = {
            toolName: toolCall.name,
            output: parsed ?? part.content,
          };
        }
      }
    }
  }

  return latest;
};

const isVisiblePart = (part: MessagePart) =>
  part.type === "text" || part.type === "thinking";

const renderPart = (part: MessagePart) => {
  if (part.type === "text") {
    return <div>{part.content}</div>;
  }
  if (part.type === "thinking") {
    return (
      <div className="text-xs italic text-muted-foreground">
        💭 {part.content}
      </div>
    );
  }
  return null;
};

function ChatMessageCard({ message }: { message: ChatMessage }) {
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

function TaskSidebar({ result }: { result: ListTasksResult }) {
  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg">Tasks Today</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {result.tasks.map((task) => (
          <div
            key={task.id}
            className="rounded-md border bg-background p-3 text-sm"
          >
            <div
              className={
                task.completed ? "text-muted-foreground line-through" : ""
              }
            >
              {task.title}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function DefaultToolSidebar({
  toolName,
  output,
}: {
  toolName: string;
  output: unknown;
}) {
  const serialized =
    typeof output === "string" ? output : JSON.stringify(output, null, 2);

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg">Tool Output</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm">
        <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {toolName}
        </div>
        <pre className="max-h-[420px] overflow-auto rounded-md bg-muted/30 p-3 text-xs">
          {serialized}
        </pre>
      </CardContent>
    </Card>
  );
}

function ActiveClockSidebar() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, []);

  return (
    <Card className="sticky top-6">
      <CardHeader>
        <CardTitle className="text-lg">Current Time</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="text-sm text-muted-foreground">
          {now.toLocaleDateString(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric",
          })}
        </div>
        <div className="text-2xl font-semibold tabular-nums">
          {now.toLocaleTimeString(undefined, {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
          })}
        </div>
      </CardContent>
    </Card>
  );
}

const toolRenderers: Record<
  string,
  (output: unknown) => React.ReactNode | null
> = {
  list_tasks: (output) => {
    if (!isListTasksResult(output) || output.tasks.length === 0) {
      return null;
    }
    return <TaskSidebar result={output} />;
  },
  current_time: () => <ActiveClockSidebar />,
};

const renderToolPanel = (payload: ToolPanelPayload | null) => {
  if (!payload) {
    return null;
  }
  const renderer = toolRenderers[payload.toolName];
  const rendered = renderer ? renderer(payload.output) : null;
  return rendered ?? (
    <DefaultToolSidebar toolName={payload.toolName} output={payload.output} />
  );
};

export const Route = createFileRoute("/_authed/chat/")({
  component: ChatPage,
});

export function ChatPage() {
  const [input, setInput] = useState("");
  const tools = getChatClientTools();

  const { messages, sendMessage, isLoading, error } = useChat({
    connection: fetchServerSentEvents("/api/chat"),
    tools,
  });
  const toolPanel = useMemo(
    () => renderToolPanel(getLatestToolOutput(messages)),
    [messages]
  );

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
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 lg:flex-row">
      <div className="w-full lg:flex-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Agent Chat</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ScrollArea className="h-[420px] rounded-md border bg-muted/30 p-4">
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
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-2 sm:flex-row"
            >
              <Input
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="Ask the agent..."
              />
              <Button type="submit" disabled={!input.trim() || isLoading}>
                {isLoading ? "Sending..." : "Send"}
              </Button>
            </form>
            {error ? (
              <p className="text-sm text-destructive">
                {error.message || "Unable to reach the agent."}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
      {toolPanel ? <aside className="w-full lg:w-80">{toolPanel}</aside> : null}
    </div>
  );
}
