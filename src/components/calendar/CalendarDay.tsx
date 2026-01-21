import { format } from "date-fns";

import {
  Children,
  cloneElement,
  isValidElement,
  useMemo,
  type ReactElement,
} from "react";

import type { CalendarEventResponse } from "@/server/calendar";
import { cn } from "@/lib/utils";
import { categorizeEvents } from "@/utils/calendar";
import { CalendarEvent } from "./CalendarEvent";
import { useCalendarDayValues } from "./CalendarContext";

type CalendarDayProps = {
  className?: string;
  children?: React.ReactNode;
  onDateClick?: (date: Date) => void;
  onEventClick?: (event: CalendarEventResponse) => void;
};

const maxVisibleEvents = 3;

function CalendarDay({
  className,
  children,
  onDateClick,
  onEventClick,
}: CalendarDayProps) {
  const { date, isToday, isCurrentMonth, events } = useCalendarDayValues();
  const { allDay, timed } = categorizeEvents(events);
  const visibleAllDay = allDay.slice(0, maxVisibleEvents);
  const remainingSlots = Math.max(maxVisibleEvents - visibleAllDay.length, 0);
  const visibleTimed = timed.slice(0, remainingSlots);
  const hiddenCount =
    allDay.length + timed.length - (visibleAllDay.length + visibleTimed.length);
  const visibleEvents = [...visibleAllDay, ...visibleTimed];
  type CalendarEventElement = ReactElement<{
    event?: CalendarEventResponse;
    onEventClick?: (event: CalendarEventResponse) => void;
  }>;

  const childTemplate = useMemo<CalendarEventElement | null>(() => {
    if (!children) return null;
    const onlyChild = Children.only(children);
    return isValidElement(onlyChild)
      ? (onlyChild as CalendarEventElement)
      : null;
  }, [children]);

  return (
    <button
      type="button"
      onClick={() => onDateClick?.(date)}
      className={cn(
        "bg-background p-2 min-h-[120px] flex flex-col gap-1 overflow-hidden text-left",
        "transition-colors hover:bg-accent/30",
        !isCurrentMonth && "bg-muted/30",
        className
      )}
    >
      <div className="flex items-start justify-between">
        {isToday ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
            {format(date, "d")}
          </span>
        ) : (
          <span
            className={cn(
              "text-sm font-semibold",
              isCurrentMonth ? "text-foreground" : "text-muted-foreground"
            )}
          >
            {format(date, "d")}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1">
        {childTemplate
          ? visibleEvents.map((event) =>
              cloneElement(childTemplate, {
                event,
                key: event.id,
                onEventClick,
              })
            )
          : visibleEvents.map((event) => (
              <CalendarEvent
                key={event.id}
                event={event}
                onEventClick={onEventClick}
              />
            ))}
        {hiddenCount > 0 ? (
          <span className="text-[10px] text-muted-foreground">
            +{hiddenCount} more
          </span>
        ) : null}
      </div>
    </button>
  );
}

export { CalendarDay };
