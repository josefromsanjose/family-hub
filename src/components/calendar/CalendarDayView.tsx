import { Fragment, useMemo } from "react";
import { format, startOfDay } from "date-fns";

import type { CalendarEventResponse } from "@/server/calendar";
import { getHourSlots, groupEventsByDate } from "@/utils/calendar";
import { getDayKey } from "@/utils/date";
import { CalendarEventCard } from "./CalendarEventCard";

type CalendarDayViewProps = {
  events: CalendarEventResponse[];
  onDeleteEvent: (eventId: string) => void;
};

function CalendarDayView({
  events,
  onDeleteEvent,
}: CalendarDayViewProps) {
  const date = useMemo(() => startOfDay(new Date()), []);
  const hourSlots = useMemo(() => getHourSlots(), []);
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);
  const allDayEvents = useMemo(
    () => (eventsByDate[getDayKey(date)] ?? []).filter((event) => !event.time),
    [date, eventsByDate]
  );
  const timedEventsByHour = useMemo(() => {
    const grouped: Record<number, CalendarEventResponse[]> = {};
    (eventsByDate[getDayKey(date)] ?? [])
      .filter((event) => event.time)
      .forEach((event) => {
        const [hourPart] = event.time?.split(":") ?? [];
        const parsedHour = Number(hourPart);
        if (Number.isNaN(parsedHour)) return;
        const clampedHour = Math.min(Math.max(parsedHour, 0), 23);
        if (!grouped[clampedHour]) grouped[clampedHour] = [];
        grouped[clampedHour].push(event);
      });
    return grouped;
  }, [date, eventsByDate]);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-[72px_1fr] gap-3 text-xs font-semibold text-muted-foreground">
        <div />
        <div className="text-sm font-semibold text-foreground">
          {format(date, "EEE, MMM d")}
        </div>
      </div>
      <div className="grid grid-cols-[72px_1fr] gap-3">
        <div className="text-xs font-semibold text-muted-foreground">All day</div>
        <div className="flex flex-col gap-2">
          {allDayEvents.length === 0 ? (
            <p className="text-xs text-muted-foreground">No all-day events.</p>
          ) : (
            allDayEvents.map((event) => (
              <CalendarEventCard
                key={event.id}
                compact
                title={event.title}
                description={event.description}
                time={event.time}
                onDelete={() => onDeleteEvent(event.id)}
              />
            ))
          )}
        </div>
      </div>
      <div className="grid grid-cols-[72px_1fr]">
        {hourSlots.map((slot) => (
          <Fragment key={slot.hour}>
            <div className="border-t border-border py-3 text-[11px] text-muted-foreground">
              {slot.label}
            </div>
            <div className="border-t border-border px-2 py-2 min-h-12">
              {(timedEventsByHour[slot.hour] ?? []).length === 0 ? (
                <span className="text-[11px] text-muted-foreground">
                  &nbsp;
                </span>
              ) : (
                (timedEventsByHour[slot.hour] ?? []).map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    compact
                    title={event.title}
                    description={event.description}
                    time={event.time}
                    onDelete={() => onDeleteEvent(event.id)}
                  />
                ))
              )}
            </div>
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export { CalendarDayView };
