import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type ChatComposerProps = {
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
};

export function ChatComposer({
  input,
  isLoading,
  onInputChange,
  onSubmit,
}: ChatComposerProps) {
  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-2 sm:flex-row">
      <Input
        value={input}
        onChange={(event) => onInputChange(event.target.value)}
        placeholder="Ask the agent..."
      />
      <Button type="submit" disabled={!input.trim() || isLoading}>
        {isLoading ? "Sending..." : "Send"}
      </Button>
    </form>
  );
}
