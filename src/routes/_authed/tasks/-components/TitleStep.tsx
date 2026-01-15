import { Input } from "@/components/ui/input";
import type { TaskData } from "./TaskWizard.types";

interface TitleStepProps {
  data: TaskData;
  onChange: (next: Partial<TaskData>) => void;
}

export function TitleStep({ data, onChange }: TitleStepProps) {
  return (
    <Input
      autoFocus
      placeholder="e.g., Take out the trash"
      value={data.title}
      onChange={(e) => onChange({ title: e.target.value })}
      className="h-14 text-lg px-4"
    />
  );
}
