import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { addDays, endOfDay, format, startOfDay, startOfWeek } from "date-fns";
import { useMemo, useState } from "react";
import {
  Plus,
  Calendar as CalendarIcon,
  Bell,
  Stethoscope,
} from "lucide-react";
import {
  AgendaList,
  CalendarEventCard,
  CalendarHeader,
  CalendarShell,
} from "@/components/calendar";
import { useCalendar } from "@/contexts/CalendarContext";
import { useHousehold, type HouseholdMember } from "@/contexts/HouseholdContext";
import { SelectionCard } from "@/components/touch/SelectionCard";
import { AvatarCard } from "@/components/touch/AvatarCard";
import { QuickDatePicker } from "@/components/touch/QuickDatePicker";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCalendarEvents,
  type CalendarEventResponse,
} from "@/server/calendar";
import { Button } from "@/components/ui/button";

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

function CalendarFilters({
  rangeStart,
  rangeEnd,
  onStartChange,
  onEndChange,
  participantFilter,
  onParticipantChange,
  members,
}: {
  rangeStart: Date;
  rangeEnd: Date;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
  participantFilter: string | null;
  onParticipantChange: (value: string | null) => void;
  members: HouseholdMember[];
}) {
  return (
    <div className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-border">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-3">
          <CalendarHeader
            label="Date range"
            subLabel={``}
          />
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                Start date
              </label>
              <Input
                type="date"
                value={format(rangeStart, "yyyy-MM-dd")}
                onChange={(event) => onStartChange(event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">
                End date
              </label>
              <Input
                type="date"
                value={format(rangeEnd, "yyyy-MM-dd")}
                onChange={(event) => onEndChange(event.target.value)}
              />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <CalendarHeader
            label="Filter by member"
            subLabel=""
          />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <AvatarCard
              name="All"
              color="bg-muted"
              selected={participantFilter === null}
              onSelect={() => onParticipantChange(null)}
            />
            {members.map((member) => (
              <AvatarCard
                key={member.id}
                name={member.name}
                color={member.color || "bg-muted"}
                selected={participantFilter === member.id}
                onSelect={() => onParticipantChange(member.id)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CalendarPage() {
  const { addEvent, deleteEvent } = useCalendar();
  const { members } = useHousehold();
  const [showAddForm, setShowAddForm] = useState(false);
  const [rangeStart, setRangeStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [rangeEnd, setRangeEnd] = useState(() =>
    addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 6)
  );
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
        const dateKey = event.date.split("T")[0];
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

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return events
      .filter((event) => event.date.split("T")[0] >= today)
      .sort((a, b) => {
        const dateCompare = a.date.localeCompare(b.date);
        if (dateCompare !== 0) return dateCompare;
        return (a.time || "").localeCompare(b.time || "");
      })
      .slice(0, 5);
  }, [events]);

  const handleStartChange = (value: string) => {
    if (!value) return;
    const nextStart = new Date(`${value}T00:00:00`);
    if (Number.isNaN(nextStart.valueOf())) return;
    setRangeStart(nextStart);
    if (nextStart > rangeEnd) {
      setRangeEnd(nextStart);
    }
  };

  const handleEndChange = (value: string) => {
    if (!value) return;
    const nextEnd = new Date(`${value}T00:00:00`);
    if (Number.isNaN(nextEnd.valueOf())) return;
    setRangeEnd(nextEnd);
    if (nextEnd < rangeStart) {
      setRangeStart(nextEnd);
    }
  };

  const getEventTypeStyle = (type: (typeof eventTypes)[number]["value"]) => {
    return (
      eventTypes.find((et) => et.value === type)?.color || eventTypes[0].color
    );
  };

  const getEventTypeLabel = (type: (typeof eventTypes)[number]["value"]) => {
    return eventTypes.find((et) => et.value === type)?.label ?? "Event";
  };

  const getParticipantLabel = (participantId?: string | null) => {
    if (!participantId) return null;
    return members.find((member) => member.id === participantId)?.name ?? null;
  };

  return (
    <CalendarShell
      title="Family Calendar"
      description="Keep track of appointments, events, and reminders"
      actions={
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus size={20} />
          Add Event
        </Button>
      }
    >

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

        <CalendarFilters
          rangeStart={rangeStart}
          rangeEnd={rangeEnd}
          onStartChange={handleStartChange}
          onEndChange={handleEndChange}
          participantFilter={participantFilter}
          onParticipantChange={setParticipantFilter}
          members={members}
        />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Events by Date</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {eventQuery.isLoading ? (
                  <div className="py-12 text-center">
                    <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">Loading events...</p>
                  </div>
                ) : eventQuery.error ? (
                  <div className="py-12 text-center">
                    <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      Error loading events.
                    </p>
                  </div>
                ) : events.length === 0 ? (
                  <div className="py-12 text-center">
                    <CalendarIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                    <p className="text-muted-foreground">
                      No events scheduled yet
                    </p>
                  </div>
                ) : (
                  Object.entries(eventsByDate)
                    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
                    .map(([date, dateEvents]) => (
                      <div
                        key={date}
                        className="border-b border-border pb-4 last:border-0"
                      >
                        <h3 className="mb-3 text-lg font-semibold text-foreground">
                          {new Date(date).toLocaleDateString("en-US", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </h3>
                        <div className="space-y-2">
                          {dateEvents.map((event) => (
                            <CalendarEventCard
                              key={event.id}
                              title={event.title}
                              description={event.description}
                              time={event.time}
                              typeLabel={getEventTypeLabel(event.type)}
                              typeClassName={getEventTypeStyle(event.type)}
                              participantLabel={getParticipantLabel(
                                event.participantId
                              )}
                              onDelete={() => deleteEvent(event.id)}
                            />
                          ))}
                        </div>
                      </div>
                    ))
                )}
              </CardContent>
            </Card>
          </div>

          <div>
            <Card>
              <CardHeader className="pb-4">
                <CardTitle>Upcoming Events</CardTitle>
              </CardHeader>
              <CardContent>
                <AgendaList
                  items={upcomingEvents}
                  isLoading={eventQuery.isLoading}
                  error={Boolean(eventQuery.error)}
                  emptyState={
                    <p className="text-muted-foreground text-sm">
                      No upcoming events
                    </p>
                  }
                  renderItem={(event) => (
                    <CalendarEventCard
                      key={event.id}
                      compact
                      title={event.title}
                      time={event.time}
                      dateLabel={format(new Date(event.date), "MMM d")}
                      typeLabel={getEventTypeLabel(event.type)}
                      typeClassName={getEventTypeStyle(event.type)}
                      participantLabel={getParticipantLabel(
                        event.participantId
                      )}
                    />
                  )}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </CalendarShell>
  );
}
