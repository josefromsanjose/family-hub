import { createContext, useCallback, useContext, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  type CalendarEventResponse,
  type CreateCalendarEventInput,
} from "@/server/calendar";

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: "appointment" | "event" | "reminder";
  recurrence?: "daily" | "weekly" | "monthly";
  endDate?: string;
  participantId?: string;
}

export type CreateCalendarEvent = Omit<
  CreateCalendarEventInput,
  "date" | "endDate"
> & {
  date: Date;
  endDate?: Date | null;
};

interface CalendarContextType {
  events: CalendarEvent[];
  isLoading: boolean;
  error: Error | null;
  addEvent: (event: CreateCalendarEvent) => void;
  deleteEvent: (id: string) => void;
}

const CalendarContext = createContext<CalendarContextType | undefined>(
  undefined
);

export function CalendarProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const {
    data: eventsData = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["calendar-events"],
    queryFn: () => getCalendarEvents({ data: {} }),
  });

  const events: CalendarEvent[] = eventsData as CalendarEventResponse[];

  const createMutation = useMutation({
    mutationFn: createCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCalendarEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });

  const addEvent = useCallback(
    (event: CreateCalendarEvent) => {
      const input: CreateCalendarEventInput = {
        title: event.title,
        description: event.description,
        date: event.date.toISOString(),
        time: event.time,
        type: event.type,
        recurrence: event.recurrence,
        endDate: event.endDate ? event.endDate.toISOString() : null,
        participantId: event.participantId,
      };
      createMutation.mutate({ data: input });
    },
    [createMutation]
  );

  const deleteEventById = useCallback(
    (id: string) => {
      deleteMutation.mutate({ data: { id } });
    },
    [deleteMutation]
  );

  return (
    <CalendarContext.Provider
      value={{
        events,
        isLoading,
        error: error as Error | null,
        addEvent,
        deleteEvent: deleteEventById,
      }}
    >
      {children}
    </CalendarContext.Provider>
  );
}

export function useCalendar() {
  const context = useContext(CalendarContext);
  if (context === undefined) {
    throw new Error("useCalendar must be used within a CalendarProvider");
  }
  return context;
}
