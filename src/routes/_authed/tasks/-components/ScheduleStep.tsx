import { useEffect } from "react";
import { CalendarDays, Repeat } from "lucide-react";
import { SelectionCard } from "@/components/touch/SelectionCard";
import { QuickDatePicker } from "@/components/touch/QuickDatePicker";
import type { TaskData } from "./TaskWizard.types";

const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
];

const MONTH_WEEKS = [
  { value: 1, label: "1st" },
  { value: 2, label: "2nd" },
  { value: 3, label: "3rd" },
  { value: 4, label: "4th" },
  { value: 5, label: "5th" },
];

function getWeekOfMonth(date: Date): number {
  return Math.floor((date.getDate() - 1) / 7) + 1;
}

function getNextValidDayOfMonth(day: number): Date {
  let year = new Date().getFullYear();
  let month = new Date().getMonth();

  for (let i = 0; i < 24; i += 1) {
    const candidate = new Date(year, month, day);
    if (candidate.getDate() === day) {
      return candidate;
    }
    month += 1;
    if (month > 11) {
      month = 0;
      year += 1;
    }
  }

  return new Date();
}

interface ScheduleStepProps {
  data: TaskData;
  onChange: (next: Partial<TaskData>) => void;
}

interface DayToggleCardProps {
  label: string;
  selected: boolean;
  onSelect: () => void;
}

function DayToggleCard({ label, selected, onSelect }: DayToggleCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`w-full min-h-[72px] rounded-xl border-2 flex items-center justify-center text-lg font-semibold transition-all duration-150 active:scale-[0.98] ${
        selected
          ? "border-primary bg-primary/10 text-foreground"
          : "border-border bg-background text-foreground hover:border-primary/50"
      }`}
    >
      {label}
    </button>
  );
}

export function ScheduleStep({ data, onChange }: ScheduleStepProps) {
  useEffect(() => {
    if (data.recurrence === "weekly" && data.recurrenceDays.length === 0) {
      onChange({ recurrenceDays: [new Date().getDay()] });
    }
  }, [data.recurrence, data.recurrenceDays, onChange]);

  useEffect(() => {
    if (data.recurrence === "monthly" && data.monthlyPattern === null) {
      const today = new Date();
      onChange({
        monthlyPattern: "day_of_month",
        recurrenceDayOfMonth: today.getDate(),
        recurrenceWeekday: null,
        recurrenceWeekOfMonth: null,
      });
    }
  }, [data.recurrence, data.monthlyPattern, onChange]);

  if (data.recurrence === "once") {
    return (
      <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
        Scheduling applies to recurring chores only.
      </div>
    );
  }

  if (data.recurrence === "daily") {
    return (
      <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
        Daily chores show every day automatically.
      </div>
    );
  }

  if (data.recurrence === "weekly") {
    return (
      <div className="space-y-4">
        <div className="text-sm text-muted-foreground">
          Pick the days this chore should show up.
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {WEEKDAYS.map((day) => {
            const selected = data.recurrenceDays.includes(day.value);
            return (
              <DayToggleCard
                key={day.value}
                label={day.label}
                selected={selected}
                onSelect={() => {
                  const next = selected
                    ? data.recurrenceDays.filter((d) => d !== day.value)
                    : [...data.recurrenceDays, day.value];
                  onChange({ recurrenceDays: next });
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (data.recurrence === "monthly") {
    const pattern = data.monthlyPattern;
    const today = new Date();
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SelectionCard
            label="Day of month"
            description="Same date every month"
            icon={<CalendarDays className="h-5 w-5" />}
            selected={pattern === "day_of_month"}
            onSelect={() =>
              onChange({
                monthlyPattern: "day_of_month",
                recurrenceDayOfMonth:
                  data.recurrenceDayOfMonth ?? today.getDate(),
                recurrenceWeekday: null,
                recurrenceWeekOfMonth: null,
              })
            }
          />
          <SelectionCard
            label="Nth weekday"
            description="e.g., 2nd Sunday"
            icon={<Repeat className="h-5 w-5" />}
            selected={pattern === "nth_weekday"}
            onSelect={() =>
              onChange({
                monthlyPattern: "nth_weekday",
                recurrenceDayOfMonth: null,
                recurrenceWeekday: data.recurrenceWeekday ?? today.getDay(),
                recurrenceWeekOfMonth:
                  data.recurrenceWeekOfMonth ?? getWeekOfMonth(today),
              })
            }
          />
        </div>

        {pattern === "day_of_month" && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Choose the day of the month.
            </div>
            <QuickDatePicker
              value={getNextValidDayOfMonth(
                data.recurrenceDayOfMonth ?? today.getDate()
              )}
              onChange={(date) => {
                if (!date) return;
                onChange({
                  recurrenceDayOfMonth: date.getDate(),
                  recurrenceWeekday: null,
                  recurrenceWeekOfMonth: null,
                });
              }}
            />
          </div>
        )}

        {pattern === "nth_weekday" && (
          <div className="space-y-3">
            <div className="text-sm text-muted-foreground">
              Choose which week and weekday.
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
              {MONTH_WEEKS.map((week) => (
                <SelectionCard
                  key={week.value}
                  label={week.label}
                  selected={data.recurrenceWeekOfMonth === week.value}
                  onSelect={() =>
                    onChange({ recurrenceWeekOfMonth: week.value })
                  }
                />
              ))}
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {WEEKDAYS.map((day) => (
                <DayToggleCard
                  key={day.value}
                  label={day.label}
                  selected={data.recurrenceWeekday === day.value}
                  onSelect={() => onChange({ recurrenceWeekday: day.value })}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return null;
}
