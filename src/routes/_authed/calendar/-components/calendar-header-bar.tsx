import { useCallback, useEffect, useMemo, useState } from "react";
import { format, startOfDay } from "date-fns";

import { CalendarMonthHeader } from "@/components/calendar";
import { getMonthGridDates } from "@/utils/calendar";
import { getWeekDates } from "@/utils/date";

type CalendarHeaderBarProps = {
  view: "day" | "week" | "month";
  onViewChange: (value: "day" | "week" | "month") => void;
  onRangeChange: (range: {
    rangeStart: Date;
    rangeEnd: Date;
    rangeLabel: string;
    currentMonth: number;
  }) => void;
};

function CalendarHeaderBar({
  view,
  onViewChange,
  onRangeChange,
}: CalendarHeaderBarProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const [currentMonth, setCurrentMonth] = useState(
    () => today.getMonth() + 1
  );

  const monthDate = useMemo(
    () => new Date(today.getFullYear(), currentMonth - 1, 1),
    [currentMonth, today]
  );

  const viewRange = useMemo(() => {
    const baseDate = today;

    if (view === "day") {
      return {
        rangeStart: baseDate,
        rangeEnd: baseDate,
      };
    }

    if (view === "week") {
      const weekDates = getWeekDates(baseDate);
      return {
        rangeStart: weekDates[0],
        rangeEnd: weekDates[weekDates.length - 1],
      };
    }

    const monthDates = getMonthGridDates(monthDate);
    return {
      rangeStart: monthDates[0],
      rangeEnd: monthDates[monthDates.length - 1],
    };
  }, [monthDate, today, view]);

  const rangeLabel = useMemo(() => {
    if (view === "day") {
      return format(today, "EEEE, MMM d, yyyy");
    }

    if (view === "week") {
      return `${format(viewRange.rangeStart, "MMM d")} - ${format(
        viewRange.rangeEnd,
        "MMM d, yyyy"
      )}`;
    }

    return format(monthDate, "MMMM yyyy");
  }, [monthDate, today, view, viewRange.rangeEnd, viewRange.rangeStart]);

  useEffect(() => {
    onRangeChange({
      rangeStart: viewRange.rangeStart,
      rangeEnd: viewRange.rangeEnd,
      rangeLabel,
      currentMonth,
    });
  }, [currentMonth, onRangeChange, rangeLabel, viewRange.rangeEnd, viewRange.rangeStart]);

  const handlePrevMonth = useCallback(() => {
    setCurrentMonth((prev) => (prev === 1 ? 12 : prev - 1));
  }, []);

  const handleNextMonth = useCallback(() => {
    setCurrentMonth((prev) => (prev === 12 ? 1 : prev + 1));
  }, []);

  return (
    <CalendarMonthHeader
      label={rangeLabel}
      view={view}
      onViewChange={onViewChange}
      onPrevMonth={handlePrevMonth}
      onNextMonth={handleNextMonth}
    />
  );
}

export { CalendarHeaderBar };
