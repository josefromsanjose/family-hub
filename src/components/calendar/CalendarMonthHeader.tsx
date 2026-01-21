import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export type CalendarView = "day" | "week" | "month";

const calendarViews: Array<{ value: CalendarView; label: string }> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

type CalendarMonthHeaderProps = {
  label: string;
  view: CalendarView;
  onViewChange: (value: CalendarView) => void;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  className?: string;
};

function CalendarMonthHeader({
  label,
  view,
  onViewChange,
  onPrevMonth,
  onNextMonth,
  className,
}: CalendarMonthHeaderProps) {
  const isMonthView = view === "month";
  const handleViewChange = (value: string) => {
    if (value === "day" || value === "week" || value === "month") {
      onViewChange(value);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevMonth}
          aria-label="Previous month"
          disabled={!isMonthView}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="text-lg font-semibold text-foreground">{label}</div>
        <Button
          variant="ghost"
          size="icon"
          onClick={onNextMonth}
          aria-label="Next month"
          disabled={!isMonthView}
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>
      <Tabs value={view} onValueChange={handleViewChange}>
        <TabsList className="w-full sm:w-fit">
          {calendarViews.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

export { CalendarMonthHeader };
