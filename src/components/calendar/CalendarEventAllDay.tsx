import type { CalendarEventResponse } from "@/server/calendar";
import { cn } from "@/lib/utils";

const eventStyles = {
  pill: "bg-chart-2/30 text-foreground",
  dot: "text-chart-2",
};

type CalendarEventAllDayProps = {
  event: CalendarEventResponse;
  onClick?: (event: CalendarEventResponse) => void;
  className?: string;
};

function CalendarEventAllDay({
  event,
  onClick,
  className,
}: CalendarEventAllDayProps) {
  return (
    <button
      type="button"
      onClick={(eventClick) => {
        eventClick.stopPropagation();
        onClick?.(event);
      }}
      className={cn(
        "w-full rounded-md px-2 py-1 text-xs font-medium text-left truncate",
        "transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        eventStyles.pill,
        className
      )}
    >
      {event.title}
    </button>
  );
}

export { CalendarEventAllDay, eventStyles };
