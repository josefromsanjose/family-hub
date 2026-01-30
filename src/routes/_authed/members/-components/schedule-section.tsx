import { Link } from "@tanstack/react-router";
import { EventCard } from "./event-card";
import { EmptyState } from "./empty-state";

interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  time?: string | null;
  participantId?: string | null;
}

interface ScheduleSectionProps {
  events: CalendarEvent[];
}

export function ScheduleSection({ events }: ScheduleSectionProps) {
  return (
    <section className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-card-foreground">
          Today's Schedule
        </h2>
        <Link
          to="/calendar"
          className="text-sm text-primary hover:text-primary/80 font-medium"
        >
          View calendar →
        </Link>
      </div>

      {events.length === 0 ? (
        <EmptyState message="No events scheduled for today." />
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}
