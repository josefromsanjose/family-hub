const allowedModels = [
  "gpt-4.1-mini",
  "gpt-4.1",
  "gpt-4o-mini",
  "gpt-4o",
  "gpt-5",
  "gpt-5-mini",
  "gpt-5-nano",
  "gpt-5-pro",
  "gpt-5.1",
  "gpt-5.1-codex",
  "gpt-5.2",
  "gpt-5.2-chat-latest",
  "gpt-5.2-pro",
] as const;

export type AllowedModel = (typeof allowedModels)[number];

export const resolveModel = (): AllowedModel => {
  const envModel = process.env.OPENAI_MODEL;
  if (allowedModels.includes(envModel as AllowedModel)) {
    return envModel as AllowedModel;
  }

  return "gpt-4.1-mini";
};
