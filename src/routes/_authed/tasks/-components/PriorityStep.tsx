import { SelectionCard } from "@/components/touch/SelectionCard";
import type { PriorityOption, TaskData } from "./TaskWizard.types";

interface PriorityStepProps {
  data: TaskData;
  onChange: (next: Partial<TaskData>) => void;
  priorities: PriorityOption[];
}

export function PriorityStep({
  data,
  onChange,
  priorities,
}: PriorityStepProps) {
  return (
    <div className="space-y-3">
      {priorities.map((priority) => {
        const Icon = priority.icon;
        return (
          <SelectionCard
            key={priority.id}
            label={priority.label}
            description={priority.description}
            icon={<Icon className="w-6 h-6" />}
            selected={data.priority === priority.id}
            onSelect={() => onChange({ priority: priority.id })}
          />
        );
      })}
    </div>
  );
}
