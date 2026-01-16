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
          onSelect={() => {
            const today = new Date();
            if (freq.id === "weekly") {
              onChange({
                recurrence: freq.id,
                dueDate: null,
                recurrenceDays: data.recurrenceDays.length
                  ? data.recurrenceDays
                  : [today.getDay()],
                recurrenceDayOfMonth: null,
                recurrenceWeekday: null,
                recurrenceWeekOfMonth: null,
                monthlyPattern: null,
                rotationMode: data.rotationMode,
              });
              return;
            }
            if (freq.id === "monthly") {
              onChange({
                recurrence: freq.id,
                dueDate: null,
                recurrenceDays: [],
                recurrenceDayOfMonth: today.getDate(),
                recurrenceWeekday: null,
                recurrenceWeekOfMonth: null,
                monthlyPattern: "day_of_month",
                rotationMode: "none",
                rotationAssignees: [],
                rotationAnchorDate: null,
              });
              return;
            }
            if (freq.id === "daily") {
              onChange({
                recurrence: freq.id,
                dueDate: null,
                recurrenceDays: [],
                recurrenceDayOfMonth: null,
                recurrenceWeekday: null,
                recurrenceWeekOfMonth: null,
                monthlyPattern: null,
                rotationMode: "none",
                rotationAssignees: [],
                rotationAnchorDate: null,
              });
              return;
            }
            onChange({
              recurrence: freq.id,
              dueDate: data.dueDate,
              recurrenceDays: [],
              recurrenceDayOfMonth: null,
              recurrenceWeekday: null,
              recurrenceWeekOfMonth: null,
              monthlyPattern: null,
              rotationMode: "none",
              rotationAssignees: [],
              rotationAnchorDate: null,
            });
          }}
        />
      ))}
    </div>
  );
}
