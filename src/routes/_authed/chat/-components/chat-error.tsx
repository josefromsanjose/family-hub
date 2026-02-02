type ChatErrorProps = {
  error?: Error;
};

export function ChatError({ error }: ChatErrorProps) {
  if (!error) {
    return null;
  }

  return (
    <p className="text-sm text-destructive">
      {error.message || "Unable to reach the agent."}
    </p>
  );
}
