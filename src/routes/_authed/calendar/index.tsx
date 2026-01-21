import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { endOfDay, format, startOfDay } from "date-fns";
import { useMemo, useState } from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import {
  CalendarEventForm,
  CalendarMonthHeader,
  Calendar,
  CalendarSidebar,
  CalendarMonth,
  CalendarDayView,
  CalendarWeekView,
} from "@/components/calendar";
import { useCalendar } from "@/contexts/CalendarContext";
import { useHousehold } from "@/contexts/HouseholdContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getCalendarEvents,
  type CalendarEventResponse,
} from "@/server/calendar";
import type { CalendarEventFormData } from "@/components/calendar/CalendarEventForm";
import { getDayKey, getWeekDates } from "@/utils/date";
import { getMonthGridDates } from "@/utils/calendar";

export const Route = createFileRoute("/_authed/calendar/")({
  component: CalendarPage,
});

type CalendarView = "day" | "week" | "month";

export function CalendarPage() {
  const { addEvent, deleteEvent, updateEvent } = useCalendar();
  const { members } = useHousehold();
  const [showAddForm, setShowAddForm] = useState(false);
  const [view, setView] = useState<CalendarView>("month");
  const [currentMonth, setCurrentMonth] = useState(
    () => new Date().getMonth() + 1
  );
  const [participantFilter, setParticipantFilter] = useState<string | null>(
    null
  );
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [formData, setFormData] = useState<CalendarEventFormData>({
    title: "",
    description: "",
    date: new Date(),
    time: "",
    type: "event",
    participantId: null as string | null,
  });

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      date: new Date(),
      time: "",
      type: "event",
      participantId: null,
    });
  };

  const handleAddEvent = () => {
    if (!formData.title.trim()) return;

    if (editingEventId) {
      updateEvent({
        id: editingEventId,
        title: formData.title,
        description: formData.description ? formData.description : null,
        date: formData.date,
        time: formData.time ? formData.time : null,
        type: formData.type,
        participantId: formData.participantId,
      });
      setEditingEventId(null);
    } else {
      addEvent({
        title: formData.title,
        description: formData.description || undefined,
        date: formData.date,
        time: formData.time || undefined,
        type: formData.type,
        participantId: formData.participantId,
      });
    }

    resetForm();
    setShowAddForm(false);
  };

  const handleOpenCreateForm = () => {
    setEditingEventId(null);
    resetForm();
    setShowAddForm(true);
  };

  const handleEventClick = (event: CalendarEventResponse) => {
    setEditingEventId(event.id);
    setShowAddForm(true);
    setFormData({
      title: event.title,
      description: event.description ?? "",
      date: new Date(event.date),
      time: event.time ?? "",
      type: event.type,
      participantId: event.participantId ?? null,
    });
  };

  const handleDayClick = (date: Date) => {
    setEditingEventId(null);
    setFormData({
      title: "",
      description: "",
      date,
      time: "",
      type: "event",
      participantId: participantFilter,
    });
    setShowAddForm(true);
  };

  const today = startOfDay(new Date());

  const monthDate = useMemo(
    () => new Date(today.getFullYear(), currentMonth - 1, 1),
    [currentMonth, today]
  );

  const viewRange = useMemo(() => {
    const baseDate = today;

    if (view === "day") {
      return {
        rangeStart: baseDate,
        rangeEnd: baseDate,
        weekDates: [] as Date[],
      };
    }

    if (view === "week") {
      const weekDates = getWeekDates(baseDate);
      return {
        rangeStart: weekDates[0],
        rangeEnd: weekDates[weekDates.length - 1],
        weekDates,
      };
    }

    const monthDates = getMonthGridDates(monthDate);
    return {
      rangeStart: monthDates[0],
      rangeEnd: monthDates[monthDates.length - 1],
      weekDates: [] as Date[],
    };
  }, [monthDate, today, view]);

  const rangeStart = viewRange.rangeStart;
  const rangeEnd = viewRange.rangeEnd;
  const weekDates = viewRange.weekDates;
  const rangeLabel = useMemo(() => {
    if (view === "day") {
      return format(today, "EEEE, MMM d, yyyy");
    }

    if (view === "week") {
      return `${format(rangeStart, "MMM d")} - ${format(
        rangeEnd,
        "MMM d, yyyy"
      )}`;
    }

    return format(monthDate, "MMMM yyyy");
  }, [monthDate, rangeEnd, rangeStart, today, view]);

  const startDateIso = useMemo(
    () => startOfDay(rangeStart).toISOString(),
    [rangeStart]
  );
  const endDateIso = useMemo(
    () => endOfDay(rangeEnd).toISOString(),
    [rangeEnd]
  );

  const eventQuery = useQuery({
    queryKey: [
      "calendar-events",
      startDateIso,
      endDateIso,
      participantFilter ?? "all",
    ],
    queryFn: () =>
      getCalendarEvents({
        data: {
          startDate: startDateIso,
          endDate: endDateIso,
          ...(participantFilter ? { participantId: participantFilter } : {}),
        },
      }),
  });

  const events = eventQuery.data ?? [];
  const hourSlots = useMemo(
    () =>
      Array.from({ length: 24 }, (_, hour) => ({
        hour,
        label:
          hour === 0
            ? "12 AM"
            : hour < 12
              ? `${hour} AM`
              : hour === 12
                ? "12 PM"
                : `${hour - 12} PM`,
      })),
    []
  );

  const allDayEventsByDate = useMemo(() => {
    const grouped: Record<string, CalendarEventResponse[]> = {};
    events.forEach((event) => {
      if (event.time) return;
      const dateKey = getDayKey(new Date(event.date));
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    });
    return grouped;
  }, [events]);

  const timedEventsByDateHour = useMemo(() => {
    const grouped: Record<string, Record<number, CalendarEventResponse[]>> = {};
    events.forEach((event) => {
      if (!event.time) return;
      const [hourPart] = event.time.split(":");
      const parsedHour = Number(hourPart);
      if (Number.isNaN(parsedHour)) return;
      const clampedHour = Math.min(Math.max(parsedHour, 0), 23);
      const dateKey = getDayKey(new Date(event.date));
      if (!grouped[dateKey]) grouped[dateKey] = {};
      if (!grouped[dateKey][clampedHour]) grouped[dateKey][clampedHour] = [];
      grouped[dateKey][clampedHour].push(event);
    });
    return grouped;
  }, [events]);

  const getParticipantLabel = (participantId?: string | null) => {
    if (!participantId) return null;
    return members.find((member) => member.id === participantId)?.name ?? null;
  };

  const getAllDayEventsForDate = (date: Date) =>
    allDayEventsByDate[getDayKey(date)] ?? [];
  const getEventsForHour = (date: Date, hour: number) =>
    timedEventsByDateHour[getDayKey(date)]?.[hour] ?? [];

  return (
    <div className="bg-background px-6 pb-8">
      <div className="mx-auto flex w-full max-w-[1800px] flex-col mt-2 gap-2">
        <CalendarMonthHeader
          label={rangeLabel}
          view={view}
          onViewChange={setView}
          onPrevMonth={() =>
            setCurrentMonth((prev) => (prev === 1 ? 12 : prev - 1))
          }
          onNextMonth={() =>
            setCurrentMonth((prev) => (prev === 12 ? 1 : prev + 1))
          }
        />

        <CalendarEventForm
          isOpen={showAddForm}
          members={members}
          formData={formData}
          onChange={setFormData}
          onSubmit={handleAddEvent}
          onCancel={() => {
            setShowAddForm(false);
            setEditingEventId(null);
            resetForm();
          }}
          mode={editingEventId ? "edit" : "create"}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
          <CalendarSidebar
            members={members}
            selectedMemberId={participantFilter}
            onMemberSelect={setParticipantFilter}
            onAddEvent={handleOpenCreateForm}
          />

          <Card>
            <CardContent className="space-y-4">
              {eventQuery.isLoading ? (
                <div className="py-12 text-center">
                  <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">Loading events...</p>
                </div>
              ) : eventQuery.error ? (
                <div className="py-12 text-center">
                  <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                  <p className="text-muted-foreground">Error loading events.</p>
                </div>
              ) : (
                <>
                  {view === "day" ? (
                    <CalendarDayView
                      date={today}
                      hourSlots={hourSlots}
                      getAllDayEventsForDate={getAllDayEventsForDate}
                      getEventsForHour={getEventsForHour}
                      getParticipantLabel={getParticipantLabel}
                      onDeleteEvent={deleteEvent}
                    />
                  ) : null}
                  {view === "week" ? (
                    <CalendarWeekView
                      weekDates={weekDates}
                      today={today}
                      hourSlots={hourSlots}
                      getAllDayEventsForDate={getAllDayEventsForDate}
                      getEventsForHour={getEventsForHour}
                      getParticipantLabel={getParticipantLabel}
                      onDeleteEvent={deleteEvent}
                    />
                  ) : null}
                  {view === "month" ? (
                    <Calendar month={currentMonth}>
                      <CalendarMonth
                        events={events}
                        onDateClick={handleDayClick}
                        onEventClick={handleEventClick}
                      />
                    </Calendar>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
