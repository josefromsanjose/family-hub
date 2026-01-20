import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  eachDayOfInterval,
  endOfDay,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { Fragment, useMemo, useState } from "react";
import {
  Bell,
  Calendar as CalendarIcon,
  Check,
  Plus,
  Stethoscope,
} from "lucide-react";
import {
  CalendarEventCard,
  CalendarGrid,
  CalendarHeader,
  CalendarShell,
} from "@/components/calendar";
import { useCalendar } from "@/contexts/CalendarContext";
import { useHousehold } from "@/contexts/HouseholdContext";
import { SelectionCard } from "@/components/touch/SelectionCard";
import { AvatarCard } from "@/components/touch/AvatarCard";
import { QuickDatePicker } from "@/components/touch/QuickDatePicker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  getCalendarEvents,
  type CalendarEventResponse,
} from "@/server/calendar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getDayKey, getWeekDates } from "@/utils/date";

export const Route = createFileRoute("/_authed/calendar/")({
  component: CalendarPage,
});

const eventTypes = [
  {
    value: "appointment",
    label: "Appointment",
    color: "bg-chart-1/30 text-chart-1 border-chart-1/50",
    icon: Stethoscope,
  },
  {
    value: "event",
    label: "Event",
    color: "bg-chart-2/30 text-chart-2 border-chart-2/50",
    icon: CalendarIcon,
  },
  {
    value: "reminder",
    label: "Reminder",
    color: "bg-chart-4/30 text-chart-4 border-chart-4/50",
    icon: Bell,
  },
] as const;

type CalendarView = "day" | "week" | "month";

const calendarViews: Array<{ value: CalendarView; label: string }> = [
  { value: "day", label: "Day" },
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

const weekdayLabels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function CalendarViewTabs({
  view,
  onViewChange,
}: {
  view: CalendarView;
  onViewChange: (value: CalendarView) => void;
}) {
  const handleViewChange = (value: string) => {
    if (value === "day" || value === "week" || value === "month") {
      onViewChange(value);
    }
  };

  return (
    <div className="">
      <Tabs value={view} onValueChange={handleViewChange}>
        <TabsList className="w-full sm:w-fit">
          {calendarViews.map((option) => (
            <TabsTrigger key={option.value} value={option.value}>
              {option.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
}

function CalendarMonthCell({
  date,
  isCurrentMonth,
  isToday,
  events,
}: {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  events: CalendarEventResponse[];
}) {
  const visibleEvents = events.slice(0, 2);

  return (
    <div
      className={cn(
        "flex h-full flex-col gap-2 rounded-lg border border-border p-2 text-xs",
        isCurrentMonth ? "bg-card" : "bg-muted/30",
        isToday ? "border-primary/60 bg-primary/5" : null
      )}
    >
      <div className="flex items-center justify-between">
        <span
          className={cn(
            "text-sm font-semibold",
            isCurrentMonth ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {format(date, "d")}
        </span>
        {events.length > 0 ? (
          <span className="text-[10px] text-muted-foreground">
            {events.length} {events.length === 1 ? "event" : "events"}
          </span>
        ) : null}
      </div>
      <div className="space-y-1">
        {visibleEvents.map((event) => (
          <div
            key={event.id}
            className="truncate rounded bg-muted px-2 py-1 text-[10px] text-muted-foreground"
          >
            {event.title}
          </div>
        ))}
        {events.length > visibleEvents.length ? (
          <p className="text-[10px] text-muted-foreground">
            +{events.length - visibleEvents.length} more
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function CalendarPage() {
  const { addEvent, deleteEvent } = useCalendar();
  const { members } = useHousehold();
  const [showAddForm, setShowAddForm] = useState(false);
  const [view, setView] = useState<CalendarView>("week");
  const [participantFilter, setParticipantFilter] = useState<string | null>(
    null
  );
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: new Date(),
    time: "",
    type: "event" as (typeof eventTypes)[number]["value"],
    participantId: null as string | null,
  });

  const handleAddEvent = () => {
    if (!formData.title.trim()) return;

    addEvent({
      title: formData.title,
      description: formData.description || undefined,
      date: formData.date,
      time: formData.time || undefined,
      type: formData.type,
      participantId: formData.participantId,
    });
    setFormData({
      title: "",
      description: "",
      date: new Date(),
      time: "",
      type: "event",
      participantId: null,
    });
    setShowAddForm(false);
  };

  const today = startOfDay(new Date());

  const viewRange = useMemo(() => {
    const baseDate = today;

    if (view === "day") {
      return {
        rangeStart: baseDate,
        rangeEnd: baseDate,
        weekDates: [] as Date[],
        monthDates: [] as Date[],
      };
    }

    if (view === "week") {
      const weekDates = getWeekDates(baseDate);
      return {
        rangeStart: weekDates[0],
        rangeEnd: weekDates[weekDates.length - 1],
        weekDates,
        monthDates: [] as Date[],
      };
    }

    const monthStart = startOfMonth(baseDate);
    const monthEnd = endOfMonth(baseDate);
    const gridStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    return {
      rangeStart: gridStart,
      rangeEnd: gridEnd,
      weekDates: [] as Date[],
      monthDates: eachDayOfInterval({ start: gridStart, end: gridEnd }),
    };
  }, [today, view]);

  const rangeStart = viewRange.rangeStart;
  const rangeEnd = viewRange.rangeEnd;
  const weekDates = viewRange.weekDates;
  const monthDates = viewRange.monthDates;
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

    return format(today, "MMMM yyyy");
  }, [rangeEnd, rangeStart, today, view]);

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

  const eventsByDate = useMemo(() => {
    const grouped = events.reduce(
      (acc, event) => {
        const dateKey = getDayKey(new Date(event.date));
        if (!acc[dateKey]) acc[dateKey] = [];
        acc[dateKey].push(event);
        return acc;
      },
      {} as Record<string, CalendarEventResponse[]>
    );
    Object.values(grouped).forEach((items) => {
      items.sort((a, b) => (a.time || "").localeCompare(b.time || ""));
    });
    return grouped;
  }, [events]);

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

  const getEventsForDate = (date: Date) =>
    eventsByDate[getDayKey(date)] ?? [];
  const viewLabel =
    view === "day" ? "Day" : view === "week" ? "Week" : "Month";
  const getAllDayEventsForDate = (date: Date) =>
    allDayEventsByDate[getDayKey(date)] ?? [];
  const getEventsForHour = (date: Date, hour: number) =>
    timedEventsByDateHour[getDayKey(date)]?.[hour] ?? [];

  return (
    <CalendarShell>

        {showAddForm && (
          <div className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-border">
            <h2 className="text-xl font-bold text-card-foreground mb-4">
              Add New Event
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Event Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Doctor appointment, School play, Birthday party"
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Additional details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Date
                </label>
                <QuickDatePicker
                  value={formData.date}
                  onChange={(date) =>
                    date && setFormData({ ...formData, date })
                  }
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Time (optional)
                </label>
                <input
                  type="time"
                  value={formData.time}
                  onChange={(e) =>
                    setFormData({ ...formData, time: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-ring focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Event Type
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {eventTypes.map((type) => {
                    const Icon = type.icon;
                    return (
                      <SelectionCard
                        key={type.value}
                        label={type.label}
                        icon={<Icon className="h-6 w-6" />}
                        selected={formData.type === type.value}
                        onSelect={() =>
                          setFormData({ ...formData, type: type.value })
                        }
                      />
                    );
                  })}
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-2">
                  Who is this for?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <AvatarCard
                    name="Family"
                    color="bg-muted"
                    selected={formData.participantId === null}
                    onSelect={() =>
                      setFormData({ ...formData, participantId: null })
                    }
                  />
                  {members.map((member) => (
                    <AvatarCard
                      key={member.id}
                      name={member.name}
                      color={member.color || "bg-muted"}
                      selected={formData.participantId === member.id}
                      onSelect={() =>
                        setFormData({
                          ...formData,
                          participantId: member.id,
                        })
                      }
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddEvent}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add Event
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="">
          <CalendarViewTabs view={view} onViewChange={setView} />
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
          <Card className="h-fit">
            <CardHeader>
              <Button onClick={() => setShowAddForm(!showAddForm)}>
                <Plus size={20} />
                Add Event
              </Button>
              <CardTitle>Members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <button
                type="button"
                onClick={() => setParticipantFilter(null)}
                aria-label={`Select All`}
                aria-pressed={participantFilter === null}
                className={cn(
                  "relative flex w-full items-center justify-between gap-3 rounded-xl border-2 px-2 py-2",
                  "transition-all duration-150 active:scale-[0.98]",
                  "active:border-primary/70 active:bg-primary/10",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                  participantFilter === null
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                )}
              >
                <span className="text-sm font-medium">All Members</span>
                {participantFilter === null && (
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                    <Check className="h-3 w-3" />
                  </span>
                )}
              </button>
              {members.map((member) => (
                <Fragment key={member.id}>
                  <button
                    type="button"
                    onClick={() => setParticipantFilter(member.id)}
                    aria-label={`Select ${member.name}`}
                    aria-pressed={participantFilter === member.id}
                    className={cn(
                      "relative flex w-full items-center justify-between gap-3 rounded-xl border-2 px-2 py-2",
                      "transition-all duration-150 active:scale-[0.98]",
                      "active:border-primary/70 active:bg-primary/10",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
                      participantFilter === member.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-primary/50"
                    )}
                  >
                    <span className="text-sm font-medium">{member.name}</span>
                    {participantFilter === member.id && (
                      <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                        <Check className="h-3 w-3" />
                      </span>
                    )}
                  </button>
                </Fragment>
              ))}
            </CardContent>
          </Card>

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
                    <div className="space-y-4">
                      <div className="grid grid-cols-[72px_1fr] gap-3 text-xs font-semibold text-muted-foreground">
                        <div />
                        <div className="text-sm font-semibold text-foreground">
                          {format(today, "EEE, MMM d")}
                        </div>
                      </div>
                      <div className="grid grid-cols-[72px_1fr] gap-3">
                        <div className="text-xs font-semibold text-muted-foreground">
                          All day
                        </div>
                        <div className="flex flex-col gap-2">
                          {getAllDayEventsForDate(today).length === 0 ? (
                            <p className="text-xs text-muted-foreground">
                              No all-day events.
                            </p>
                          ) : (
                            getAllDayEventsForDate(today).map((event) => (
                              <CalendarEventCard
                                key={event.id}
                                compact
                                title={event.title}
                                description={event.description}
                                time={event.time}
                                participantLabel={getParticipantLabel(
                                  event.participantId
                                )}
                                onDelete={() => deleteEvent(event.id)}
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
                              {getEventsForHour(today, slot.hour).length === 0 ? (
                                <span className="text-[11px] text-muted-foreground">
                                  &nbsp;
                                </span>
                              ) : (
                                getEventsForHour(today, slot.hour).map(
                                  (event) => (
                                    <CalendarEventCard
                                      key={event.id}
                                      compact
                                      title={event.title}
                                      description={event.description}
                                      time={event.time}
                                      participantLabel={getParticipantLabel(
                                        event.participantId
                                      )}
                                      onDelete={() => deleteEvent(event.id)}
                                    />
                                  )
                                )
                              )}
                            </div>
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {view === "week" ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-[72px_repeat(7,1fr)] gap-2 text-xs font-semibold text-muted-foreground">
                        <div />
                        {weekDates.map((date) => (
                          <div
                            key={getDayKey(date)}
                            className={cn(
                              "text-center",
                              isSameDay(date, today)
                                ? "text-foreground"
                                : "text-muted-foreground"
                            )}
                          >
                            <div className="text-[11px] uppercase">
                              {format(date, "EEE")}
                            </div>
                            <div className="text-sm font-semibold text-foreground">
                              {format(date, "d")}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-[72px_repeat(7,1fr)] gap-2">
                        <div className="text-xs font-semibold text-muted-foreground">
                          All day
                        </div>
                        {weekDates.map((date) => (
                          <div key={getDayKey(date)} className="flex flex-col gap-2">
                            {getAllDayEventsForDate(date).length === 0 ? (
                              <span className="text-xs text-muted-foreground">
                                &nbsp;
                              </span>
                            ) : (
                              getAllDayEventsForDate(date).map((event) => (
                                <CalendarEventCard
                                  key={event.id}
                                  compact
                                  title={event.title}
                                  description={event.description}
                                  time={event.time}
                                  participantLabel={getParticipantLabel(
                                    event.participantId
                                  )}
                                  onDelete={() => deleteEvent(event.id)}
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
                                    participantLabel={getParticipantLabel(
                                      event.participantId
                                    )}
                                    onDelete={() => deleteEvent(event.id)}
                                  />
                                ))}
                              </div>
                            ))}
                          </Fragment>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  {view === "month" ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-7 gap-3 text-xs font-semibold text-muted-foreground">
                        {weekdayLabels.map((label) => (
                          <div key={label} className="text-center">
                            {label}
                          </div>
                        ))}
                      </div>
                      <CalendarGrid columns={7}>
                        {monthDates.map((date) => (
                          <CalendarMonthCell
                            key={getDayKey(date)}
                            date={date}
                            isCurrentMonth={isSameMonth(date, today)}
                            isToday={isSameDay(date, today)}
                            events={getEventsForDate(date)}
                          />
                        ))}
                      </CalendarGrid>
                    </div>
                  ) : null}
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </CalendarShell>
  );
}
