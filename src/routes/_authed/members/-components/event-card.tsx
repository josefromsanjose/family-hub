interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  time?: string | null;
  participantId?: string | null;
}

interface EventCardProps {
  event: CalendarEvent;
}

export function EventCard({ event }: EventCardProps) {
  return (
    <div className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground">
            Event
          </span>
          {event.time && (
            <span className="text-xs text-muted-foreground">{event.time}</span>
          )}
        </div>
        <h3 className="font-semibold text-foreground">{event.title}</h3>
        {event.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {event.description}
          </p>
        )}
        {!event.participantId && (
          <p className="text-xs text-muted-foreground mt-1">Family event</p>
        )}
      </div>
    </div>
  );
}
