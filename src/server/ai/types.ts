export type AgentRunStep = {
  name: string;
  detail: string;
};

export type AgentRunResult = {
  runId: string;
  status: "completed";
  input: string;
  output: string;
  steps: AgentRunStep[];
  startedAt: string;
  endedAt: string;
};
