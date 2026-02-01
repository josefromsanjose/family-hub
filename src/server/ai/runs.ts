import { createServerFn } from "@tanstack/react-start";
import { randomUUID } from "crypto";
import { z } from "zod";
import { runAgentLoop } from "./loop";
import type { AgentRunResult } from "./types";
export type { AgentRunResult } from "./types";

const createAgentRunSchema = z.object({
  input: z.string().trim().min(1, "Input is required"),
});

const runs = new Map<string, AgentRunResult>();

export const createAgentRun = createServerFn({ method: "POST" })
  .inputValidator((input: z.infer<typeof createAgentRunSchema>) =>
    createAgentRunSchema.parse(input)
  )
  .handler(async ({ data }): Promise<AgentRunResult> => {
    const runId = randomUUID();
    const startedAt = new Date().toISOString();
    const { output, steps } = await runAgentLoop(data.input);
    const endedAt = new Date().toISOString();
    const result: AgentRunResult = {
      runId,
      status: "completed",
      input: data.input,
      output,
      steps,
      startedAt,
      endedAt,
    };

    runs.set(runId, result);

    return result;
  });
