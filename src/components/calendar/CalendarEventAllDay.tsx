import type { CalendarEventResponse } from "@/server/calendar";
import { cn } from "@/lib/utils";

const eventTypeStyles: Record<
  CalendarEventResponse["type"],
  { pill: string; dot: string }
> = {
  appointment: {
    pill: "bg-chart-1/30 text-foreground",
    dot: "text-chart-1",
  },
  event: {
    pill: "bg-chart-2/30 text-foreground",
    dot: "text-chart-2",
  },
  reminder: {
    pill: "bg-chart-4/30 text-foreground",
    dot: "text-chart-4",
  },
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
  const styles = eventTypeStyles[event.type];

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
        styles.pill,
        className
      )}
    >
      {event.title}
    </button>
  );
}

export { CalendarEventAllDay, eventTypeStyles };
