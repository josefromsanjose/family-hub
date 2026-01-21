import { Fragment } from "react";
import { format } from "date-fns";

import type { CalendarEventResponse } from "@/server/calendar";
import { CalendarEventCard } from "./CalendarEventCard";

type HourSlot = {
  hour: number;
  label: string;
};

type CalendarDayViewProps = {
  date: Date;
  hourSlots: HourSlot[];
  getAllDayEventsForDate: (date: Date) => CalendarEventResponse[];
  getEventsForHour: (date: Date, hour: number) => CalendarEventResponse[];
  getParticipantLabel: (participantId?: string | null) => string | null;
  onDeleteEvent: (eventId: string) => void;
};

function CalendarDayView({
  date,
  hourSlots,
  getAllDayEventsForDate,
  getEventsForHour,
  getParticipantLabel,
  onDeleteEvent,
}: CalendarDayViewProps) {
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
          {getAllDayEventsForDate(date).length === 0 ? (
            <p className="text-xs text-muted-foreground">No all-day events.</p>
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
      </div>
      <div className="grid grid-cols-[72px_1fr]">
        {hourSlots.map((slot) => (
          <Fragment key={slot.hour}>
            <div className="border-t border-border py-3 text-[11px] text-muted-foreground">
              {slot.label}
            </div>
            <div className="border-t border-border px-2 py-2 min-h-12">
              {getEventsForHour(date, slot.hour).length === 0 ? (
                <span className="text-[11px] text-muted-foreground">
                  &nbsp;
                </span>
              ) : (
                getEventsForHour(date, slot.hour).map((event) => (
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
          </Fragment>
        ))}
      </div>
    </div>
  );
}

export { CalendarDayView };
