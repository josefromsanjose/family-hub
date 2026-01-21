import { isSameDay, isSameMonth } from "date-fns";

import type { CalendarEventResponse } from "@/server/calendar";
import { groupEventsByDate, getMonthGridDates } from "@/utils/calendar";
import { CalendarDay } from "./CalendarDay";
import { CalendarDayProvider, useCalendar } from "./CalendarContext";
import { getDayKey } from "@/utils/date";

type MonthCalendarProps = {
  events?: CalendarEventResponse[];
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEventResponse) => void;
};

const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function CalendarMonth({
  events = [],
  onDateClick,
  onEventClick,
}: MonthCalendarProps) {
  const { month } = useCalendar();
  const year = new Date().getFullYear();
  const monthDate = new Date(year, month - 1, 1);
  const monthDates = getMonthGridDates(monthDate);
  const weeks: Date[][] = [];

  for (let i = 0; i < monthDates.length; i += 7) {
    weeks.push(monthDates.slice(i, i + 7));
  }
  const eventsByDate = groupEventsByDate(events);

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-7 text-[11px] font-semibold uppercase text-muted-foreground">
        {weekdayLabels.map((label) => (
          <div key={label} className="flex items-center justify-center py-2">
            {label}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 auto-rows-fr gap-px rounded-2xl bg-border overflow-hidden [aspect-ratio:7/5]">
        {weeks.flatMap((weekDates) =>
          weekDates.map((date) => {
            const dateKey = getDayKey(date);
            const dayEvents = eventsByDate[dateKey] ?? [];
            return (
              <CalendarDayProvider
                key={dateKey}
                date={date}
                isToday={isSameDay(date, new Date())}
                isCurrentMonth={isSameMonth(date, monthDate)}
                events={dayEvents}
              >
                <CalendarDay
                  onDateClick={onDateClick}
                  onEventClick={onEventClick}
                />
              </CalendarDayProvider>
            );
          })
        )}
      </div>
    </div>
  );
}

export { CalendarMonth };
