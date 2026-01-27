import type { CalendarEventResponse } from "@/server/calendar";
import { cn } from "@/lib/utils";
import { formatEventTime } from "@/utils/calendar";
import { eventStyles } from "./CalendarEventAllDay";

type CalendarEventTimedProps = {
  event: CalendarEventResponse;
  onClick?: (event: CalendarEventResponse) => void;
  className?: string;
};

function CalendarEventTimed({ event, onClick, className }: CalendarEventTimedProps) {
  const timeLabel = formatEventTime(event.time);

  return (
    <button
      type="button"
      onClick={(eventClick) => {
        eventClick.stopPropagation();
        onClick?.(event);
      }}
      className={cn(
        "flex w-full items-center gap-1 text-xs text-muted-foreground truncate text-left",
        "transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        className
      )}
    >
      <span className={cn("text-[8px]", eventStyles.dot)}>●</span>
      {timeLabel ? <span className="whitespace-nowrap">{timeLabel}</span> : null}
      <span className="truncate">{event.title}</span>
    </button>
  );
}

export { CalendarEventTimed };
