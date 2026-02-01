import { chat } from "@tanstack/ai";
import { getAgentConfig } from "./agent-factory";
import type { AgentRunResult, AgentRunStep } from "./types";

export const runAgentLoop = async (
  input: string
): Promise<Pick<AgentRunResult, "output" | "steps">> => {
  const steps: AgentRunStep[] = [];
  steps.push({
    name: "intake",
    detail: "Validated input and created a run.",
  });
  steps.push({
    name: "context",
    detail: "Prepared minimal prompt context for inference.",
  });

  steps.push({
    name: "inference",
    detail: "Requested response from OpenAI via TanStack AI.",
  });

  const agent = getAgentConfig();
  const output = await chat({
    adapter: agent.adapter,
    systemPrompts: agent.systemPrompts,
    messages: [{ role: "user", content: input }],
    tools: agent.tools,
    stream: false,
  });
  
  steps.push({
    name: "response",
    detail: "Prepared final response.",
  });

  return { output, steps };
};
