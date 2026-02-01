import { openaiText } from "@tanstack/ai-openai";
import { buildSystemPrompt } from "./context";
import { resolveModel } from "./model";
import { getAgentTools } from "./tools";

export type AgentId = "general";

type AgentConfig = {
  adapter: ReturnType<typeof openaiText>;
  systemPrompts: string[];
  tools: ReturnType<typeof getAgentTools>;
};

export const getAgentConfig = (agentId: AgentId = "general"): AgentConfig => {
  switch (agentId) {
    case "general":
    default: {
      const model = resolveModel();
      return {
        adapter: openaiText(model),
        systemPrompts: [buildSystemPrompt()],
        tools: getAgentTools(),
      };
    }
  }
};
