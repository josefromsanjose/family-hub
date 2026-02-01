import { chat, toServerSentEventsResponse } from "@tanstack/ai";
import { createFileRoute } from "@tanstack/react-router";
import { getAgentConfig, type AgentId } from "@/server/ai/agent-factory";
import { getAgentToolDefinitions } from "@/server/ai/tools";

type ChatRequestBody = {
  messages: unknown;
  conversationId?: string;
  agentId?: AgentId;
};

export const Route = createFileRoute("/_authed/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        if (!process.env.OPENAI_API_KEY) {
          return new Response(
            JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        const body = (await request.json()) as ChatRequestBody;

        try {
          const agent = getAgentConfig(body.agentId);
          const stream = chat({
            adapter: agent.adapter,
            systemPrompts: agent.systemPrompts,
            messages: body.messages as never,
            conversationId: body.conversationId,
            tools: getAgentToolDefinitions(),
          });

          return toServerSentEventsResponse(stream);
        } catch (error) {
          return new Response(
            JSON.stringify({
              error:
                error instanceof Error ? error.message : "An error occurred",
            }),
            {
              status: 500,
              headers: { "Content-Type": "application/json" },
            }
          );
        }
      },
    },
  },
});
