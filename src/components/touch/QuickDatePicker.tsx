import { useMemo, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { addDays, format, isSameDay, nextSaturday } from "date-fns";
import { SelectionCard } from "@/components/touch/SelectionCard";
import { Calendar } from "@/components/ui/calendar";

type QuickOption = "today" | "tomorrow" | "weekend" | "custom";

interface QuickDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
}

export function QuickDatePicker({ value, onChange }: QuickDatePickerProps) {
  const [showCalendar, setShowCalendar] = useState(false);

  const today = useMemo(() => new Date(), []);
  const tomorrow = useMemo(() => addDays(today, 1), [today]);
  const weekend = useMemo(() => nextSaturday(today), [today]);

  const selected = useMemo<QuickOption | null>(() => {
    if (!value) return null;
    if (isSameDay(value, today)) return "today";
    if (isSameDay(value, tomorrow)) return "tomorrow";
    if (isSameDay(value, weekend)) return "weekend";
    return "custom";
  }, [today, tomorrow, value, weekend]);

  const handleQuickSelect = (option: QuickOption) => {
    setShowCalendar(false);
    switch (option) {
      case "today":
        onChange(today);
        break;
      case "tomorrow":
        onChange(tomorrow);
        break;
      case "weekend":
        onChange(weekend);
        break;
      case "custom":
        setShowCalendar(true);
        break;
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <SelectionCard
          label="Today"
          description={format(today, "EEE, MMM d")}
          selected={selected === "today"}
          onSelect={() => handleQuickSelect("today")}
        />
        <SelectionCard
          label="Tomorrow"
          description={format(tomorrow, "EEE, MMM d")}
          selected={selected === "tomorrow"}
          onSelect={() => handleQuickSelect("tomorrow")}
        />
        <SelectionCard
          label="This Weekend"
          description={format(weekend, "EEE, MMM d")}
          selected={selected === "weekend"}
          onSelect={() => handleQuickSelect("weekend")}
        />
        <SelectionCard
          label="Pick a Date"
          icon={<CalendarIcon className="w-6 h-6" />}
          selected={selected === "custom"}
          onSelect={() => handleQuickSelect("custom")}
        />
      </div>

      {showCalendar && (
        <div className="border rounded-xl p-3">
          <Calendar
            mode="single"
            selected={value ?? undefined}
            onSelect={(date) => {
              onChange(date ?? null);
              setShowCalendar(false);
            }}
            className="mx-auto"
            classNames={{
              day: "h-11 w-11 text-base",
            }}
          />
        </div>
      )}
    </div>
  );
}
