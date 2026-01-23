import { Fragment, useMemo } from "react";
import { format, isSameDay, startOfDay } from "date-fns";

import type { CalendarEventResponse } from "@/server/calendar";
import { getHourSlots, groupEventsByDate } from "@/utils/calendar";
import { getDayKey, getWeekDates } from "@/utils/date";
import { CalendarEventCard } from "./CalendarEventCard";

type CalendarWeekViewProps = {
  events: CalendarEventResponse[];
  onDeleteEvent: (eventId: string) => void;
};

function CalendarWeekView({
  events,
  onDeleteEvent,
}: CalendarWeekViewProps) {
  const today = useMemo(() => startOfDay(new Date()), []);
  const weekDates = useMemo(() => getWeekDates(today), [today]);
  const hourSlots = useMemo(() => getHourSlots(), []);
  const eventsByDate = useMemo(() => groupEventsByDate(events), [events]);
  const allDayEventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEventResponse[]> = {};
    Object.entries(eventsByDate).forEach(([dateKey, dateEvents]) => {
      grouped[dateKey] = dateEvents.filter((event) => !event.time);
    });
    return grouped;
  }, [eventsByDate]);
  const timedEventsByDateHour = useMemo(() => {
    const grouped: Record<string, Record<number, CalendarEventResponse[]>> = {};
    Object.entries(eventsByDate).forEach(([dateKey, dateEvents]) => {
      dateEvents
        .filter((event) => event.time)
        .forEach((event) => {
          const [hourPart] = event.time?.split(":") ?? [];
          const parsedHour = Number(hourPart);
          if (Number.isNaN(parsedHour)) return;
          const clampedHour = Math.min(Math.max(parsedHour, 0), 23);
          if (!grouped[dateKey]) grouped[dateKey] = {};
          if (!grouped[dateKey][clampedHour]) grouped[dateKey][clampedHour] = [];
          grouped[dateKey][clampedHour].push(event);
        });
    });
    return grouped;
  }, [eventsByDate]);

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="grid grid-cols-[72px_repeat(7,1fr)] gap-2 text-xs font-semibold text-muted-foreground">
        <div />
        {weekDates.map((date) => (
          <div
            key={getDayKey(date)}
            className={
              isSameDay(date, today) ? "text-foreground" : "text-muted-foreground"
            }
          >
            <div className="text-[11px] uppercase text-center">
              {format(date, "EEE")}
            </div>
            <div className="text-sm font-semibold text-foreground text-center">
              {format(date, "d")}
            </div>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-[72px_repeat(7,1fr)] gap-2">
        <div className="text-xs font-semibold text-muted-foreground">All day</div>
        {weekDates.map((date) => (
          <div key={getDayKey(date)} className="flex flex-col gap-2">
            {(allDayEventsByDate[getDayKey(date)] ?? []).length === 0 ? (
              <span className="text-xs text-muted-foreground">&nbsp;</span>
            ) : (
              (allDayEventsByDate[getDayKey(date)] ?? []).map((event) => (
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
        ))}
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto">
        <div className="grid grid-cols-[72px_repeat(7,1fr)]">
          {hourSlots.map((slot) => (
            <Fragment key={slot.hour}>
              <div className="border-t border-border py-3 text-[11px] text-muted-foreground">
                {slot.label}
              </div>
              {weekDates.map((date) => (
                <div
                  key={`${getDayKey(date)}-${slot.hour}`}
                  className="border-t border-border px-2 py-2 min-h-12"
                >
                  {(timedEventsByDateHour[getDayKey(date)]?.[slot.hour] ?? []).map(
                    (event) => (
                    <CalendarEventCard
                      key={event.id}
                      compact
                      title={event.title}
                      description={event.description}
                      time={event.time}
                      onDelete={() => onDeleteEvent(event.id)}
                    />
                  )
                  )}
                </div>
              ))}
            </Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

export { CalendarWeekView };
