import type { CalendarEventResponse } from "@/server/calendar";
import { CalendarEventAllDay } from "./CalendarEventAllDay";
import { CalendarEventTimed } from "./CalendarEventTimed";

type CalendarEventProps = {
  event?: CalendarEventResponse;
  className?: string;
  onEventClick?: (event: CalendarEventResponse) => void;
};

function CalendarEvent({
  event,
  className,
  onEventClick,
}: CalendarEventProps) {
  if (!event) {
    return null;
  }

  if (event.time) {
    return (
      <CalendarEventTimed
        event={event}
        className={className}
        onClick={(selected) => onEventClick?.(selected)}
      />
    );
  }

  return (
    <CalendarEventAllDay
      event={event}
      className={className}
      onClick={(selected) => onEventClick?.(selected)}
    />
  );
}

export { CalendarEvent };
