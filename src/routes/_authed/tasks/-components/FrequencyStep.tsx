import { Repeat } from "lucide-react";
import { SelectionCard } from "@/components/touch/SelectionCard";
import type { FrequencyOption, TaskData } from "./TaskWizard.types";

interface FrequencyStepProps {
  data: TaskData;
  onChange: (next: Partial<TaskData>) => void;
  frequencies: FrequencyOption[];
}

export function FrequencyStep({
  data,
  onChange,
  frequencies,
}: FrequencyStepProps) {
  return (
    <div className="space-y-3">
      {frequencies.map((freq) => (
        <SelectionCard
          key={freq.id}
          label={freq.label}
          description={freq.description}
          icon={<Repeat className="w-6 h-6" />}
          selected={data.recurrence === freq.id}
          onSelect={() =>
            onChange({
              recurrence: freq.id,
              dueDate: freq.id === "once" ? data.dueDate : null,
            })
          }
        />
      ))}
    </div>
  );
}
