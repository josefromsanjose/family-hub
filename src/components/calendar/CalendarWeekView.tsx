import { Fragment } from "react";
import { format, isSameDay } from "date-fns";

import type { CalendarEventResponse } from "@/server/calendar";
import { getDayKey } from "@/utils/date";
import { CalendarEventCard } from "./CalendarEventCard";

type HourSlot = {
  hour: number;
  label: string;
};

type CalendarWeekViewProps = {
  weekDates: Date[];
  today: Date;
  hourSlots: HourSlot[];
  getAllDayEventsForDate: (date: Date) => CalendarEventResponse[];
  getEventsForHour: (date: Date, hour: number) => CalendarEventResponse[];
  getParticipantLabel: (participantId?: string | null) => string | null;
  onDeleteEvent: (eventId: string) => void;
};

function CalendarWeekView({
  weekDates,
  today,
  hourSlots,
  getAllDayEventsForDate,
  getEventsForHour,
  getParticipantLabel,
  onDeleteEvent,
}: CalendarWeekViewProps) {
  return (
    <div className="space-y-4">
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
            {getAllDayEventsForDate(date).length === 0 ? (
              <span className="text-xs text-muted-foreground">&nbsp;</span>
            ) : (
              getAllDayEventsForDate(date).map((event) => (
                <CalendarEventCard
                  key={event.id}
                  compact
                  title={event.title}
                  description={event.description}
                  time={event.time}
                  participantLabel={getParticipantLabel(event.participantId)}
                  onDelete={() => onDeleteEvent(event.id)}
                />
              ))
            )}
          </div>
        ))}
      </div>
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
                {getEventsForHour(date, slot.hour).map((event) => (
                  <CalendarEventCard
                    key={event.id}
                    compact
                    title={event.title}
                    description={event.description}
                    time={event.time}
                    participantLabel={getParticipantLabel(event.participantId)}
                    onDelete={() => onDeleteEvent(event.id)}
                  />
                ))}
              </div>
            ))}
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export { CalendarWeekView };
