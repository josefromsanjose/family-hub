import { useMemo } from "react";
import type { MessagePart, ToolCallPart, UIMessage } from "@tanstack/ai";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useActiveClock } from "../-hooks/use-active-clock";

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
  part.type === "tool-call" || part.type === "tool-result";

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
  const now = useActiveClock();

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

type ToolPanelProps = {
  messages: UIMessage[];
};

export function ToolPanel({ messages }: ToolPanelProps) {
  const latestToolOutput = useMemo(() => {
    const hasToolParts = messages.some((message) =>
      message.parts.some(isVisiblePart)
    );
    return hasToolParts ? getLatestToolOutput(messages) : null;
  }, [messages]);
  const panel = useMemo(
    () => renderToolPanel(latestToolOutput),
    [latestToolOutput]
  );

  if (!panel) {
    return null;
  }

  return <aside className="w-full lg:w-80">{panel}</aside>;
}
