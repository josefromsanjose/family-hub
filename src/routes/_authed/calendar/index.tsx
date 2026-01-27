import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  CalendarMonth,
  CalendarDayView,
  CalendarWeekView,
} from "@/components/calendar";
import { CalendarHeaderBar } from "./-components/calendar-header-bar";
import { CalendarSidebar } from "./-components/calendar-sidebar";
import {
  CalendarEventDialog,
  type CalendarEventDialogActions,
} from "./-components/calendar-event-dialog";
import { useCalendarEventRange } from "./-components/use-calendar-event-range";
import { deleteCalendarEvent } from "@/server/calendar";
import { Card, CardContent } from "@/components/ui/card";
import type { CalendarEventResponse } from "@/server/calendar";

export const Route = createFileRoute("/_authed/calendar/")({
  component: CalendarPage,
});

type CalendarView = "day" | "week" | "month";

export function CalendarPage() {
  const queryClient = useQueryClient();
  const [view, setView] = useState<CalendarView>("month");
  const [participantFilter, setParticipantFilter] = useState<string | null>(
    null
  );
  const [eventDialogActions, setEventDialogActions] =
    useState<CalendarEventDialogActions | null>(null);
  const { events, rangeState, setRangeState } =
    useCalendarEventRange(participantFilter);

  const deleteMutation = useMutation({
    mutationFn: deleteCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });

  const deleteEvent = useCallback(
    (id: string) => {
      deleteMutation.mutate({ data: { id } });
    },
    [deleteMutation]
  );

  const handleOpenCreateForm = useCallback(() => {
    eventDialogActions?.openCreate();
  }, [eventDialogActions]);

  const handleEventClick = useCallback(
    (event: CalendarEventResponse) => {
      eventDialogActions?.openForEvent(event);
    },
    [eventDialogActions]
  );

  const handleDayClick = useCallback(
    (date: Date) => {
      eventDialogActions?.openForDate(date);
    },
    [eventDialogActions]
  );

  return (
    <div
      style={{ height: "calc(100vh - 64px)" }}
      className="flex flex-col bg-background px-6 pb-8 overflow-y-hidden"
    >
      <div className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col mt-2 gap-2">
        <CalendarHeaderBar
          view={view}
          onViewChange={setView}
          onRangeChange={setRangeState}
        />

        <CalendarEventDialog
          participantId={participantFilter}
          onActionsReady={setEventDialogActions}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr] flex-1 min-h-0">
          <CalendarSidebar
            selectedMemberId={participantFilter}
            onMemberSelect={setParticipantFilter}
            onAddEvent={handleOpenCreateForm}
          />

          <Card className="h-full">
            <CardContent className="flex h-full flex-col space-y-4 overflow-hidden">
              <>
                {view === "day" ? (
                  <Calendar month={rangeState.currentMonth}>
                  <CalendarDayView
                    events={events}
                    onDeleteEvent={deleteEvent}
                  />
                  </Calendar>
                ) : null}
                {view === "week" ? (
                    <Calendar month={rangeState.currentMonth}>
                      <CalendarWeekView
                        events={events}
                        onDeleteEvent={deleteEvent}
                      />
                  </Calendar>
                ) : null}
                {view === "month" ? (
                  <Calendar month={rangeState.currentMonth}>
                    <CalendarMonth
                      events={events}
                      onDateClick={handleDayClick}
                      onEventClick={handleEventClick}
                    />
                  </Calendar>
                ) : null}
              </>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
