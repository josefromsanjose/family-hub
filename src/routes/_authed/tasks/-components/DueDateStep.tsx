import { SelectionCard } from "@/components/touch/SelectionCard";
import { QuickDatePicker } from "@/components/touch/QuickDatePicker";
import type { TaskData } from "./TaskWizard.types";

interface DueDateStepProps {
  data: TaskData;
  onChange: (next: Partial<TaskData>) => void;
}

export function DueDateStep({ data, onChange }: DueDateStepProps) {
  return (
    <div className="space-y-3">
      {data.recurrence !== "once" ? (
        <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
          Due dates are available for one-time tasks only.
        </div>
      ) : (
        <>
          <SelectionCard
            label="No due date"
            description="Keep it open-ended"
            selected={data.dueDate === null}
            onSelect={() => onChange({ dueDate: null })}
          />
          <QuickDatePicker
            value={data.dueDate}
            onChange={(date) => onChange({ dueDate: date })}
          />
        </>
      )}
    </div>
  );
}
