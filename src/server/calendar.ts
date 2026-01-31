import { createServerFn } from "@tanstack/react-start";
import { getConvexClient } from "@/server/convex";
import { internal } from "../../convex/_generated/api";

// ============================================================================
// Type Definitions
// ============================================================================

export type CalendarEventResponse = {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  recurrence?: "daily" | "weekly" | "monthly" | "yearly";
  endDate?: string;
  participantId?: string;
};

export type CreateCalendarEventInput = {
  title: string;
  description?: string;
  date: string; // ISO string or YYYY-MM-DD
  time?: string;
  recurrence?: "daily" | "weekly" | "monthly" | "yearly";
  endDate?: string | null;
  participantId?: string | null;
};

export type UpdateCalendarEventInput = {
  id: string;
  title?: string;
  description?: string | null;
  date?: string;
  time?: string | null;
  recurrence?: "daily" | "weekly" | "monthly" | "yearly" | null;
  endDate?: string | null;
  participantId?: string | null;
};

export type GetCalendarEventsInput = {
  startDate?: string;
  endDate?: string;
  participantId?: string;
};

export type DeleteCalendarEventInput = {
  id: string;
};

type CalendarEventRecord = {
  id: string;
  title: string;
  description: string | null;
  date: number;
  time: string | null;
  recurrence: CalendarEventResponse["recurrence"] | null;
  endDate: number | null;
  participantId: string | null;
};

const toCalendarEventResponse = (
  event: CalendarEventRecord
): CalendarEventResponse => ({
  id: event.id,
  title: event.title,
  description: event.description || undefined,
  date: new Date(event.date).toISOString(),
  time: event.time || undefined,
  recurrence: event.recurrence || undefined,
  endDate: event.endDate ? new Date(event.endDate).toISOString() : undefined,
  participantId: event.participantId || undefined,
});

// ============================================================================
// GET Operations
// ============================================================================

export const getCalendarEvents = createServerFn({ method: "GET" })
  .inputValidator((input: GetCalendarEventsInput) => {
    const startDate = input.startDate ? new Date(input.startDate) : null;
    const endDate = input.endDate ? new Date(input.endDate) : null;

    if (startDate && Number.isNaN(startDate.valueOf())) {
      throw new Error("Start date is invalid");
    }
    if (endDate && Number.isNaN(endDate.valueOf())) {
      throw new Error("End date is invalid");
    }
    if (startDate && endDate && startDate > endDate) {
      throw new Error("Start date must be before end date");
    }

    return input;
  })
  .handler(async ({ data }): Promise<CalendarEventResponse[]> => {
    const convex = await getConvexClient();
    const filters = data ?? {};

    const events = await convex.query(internal.calendar.getCalendarEvents, {
      ...(filters.startDate ? { startDate: filters.startDate } : {}),
      ...(filters.endDate ? { endDate: filters.endDate } : {}),
      ...(filters.participantId ? { participantId: filters.participantId } : {}),
    });

    return events.map(toCalendarEventResponse);
  });

// ============================================================================
// POST Operations
// ============================================================================

export const createCalendarEvent = createServerFn({ method: "POST" })
  .inputValidator((input: CreateCalendarEventInput) => {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error("Title is required");
    }
    if (!input.date) {
      throw new Error("Date is required");
    }
    const parsedDate = new Date(input.date);
    if (Number.isNaN(parsedDate.valueOf())) {
      throw new Error("Date is invalid");
    }
    if (input.endDate) {
      const parsedEndDate = new Date(input.endDate);
      if (Number.isNaN(parsedEndDate.valueOf())) {
        throw new Error("End date is invalid");
      }
      if (parsedEndDate < parsedDate) {
        throw new Error("End date must be after start date");
      }
    }
    return input;
  })
  .handler(async ({ data }): Promise<CalendarEventResponse> => {
    const convex = await getConvexClient();
    const event = await convex.mutation(internal.calendar.createCalendarEvent, {
      title: data.title.trim(),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      date: data.date,
      ...(data.time !== undefined ? { time: data.time } : {}),
      ...(data.recurrence !== undefined ? { recurrence: data.recurrence } : {}),
      ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
      ...(data.participantId !== undefined
        ? { participantId: data.participantId }
        : {}),
    });

    return toCalendarEventResponse(event);
  });

export const updateCalendarEvent = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateCalendarEventInput) => {
    if (!input.id) {
      throw new Error("Event ID is required");
    }
    if (input.title !== undefined && input.title.trim().length === 0) {
      throw new Error("Title is required");
    }
    if (input.date !== undefined) {
      const parsedDate = new Date(input.date);
      if (Number.isNaN(parsedDate.valueOf())) {
        throw new Error("Date is invalid");
      }
    }
    if (input.endDate !== undefined && input.endDate !== null) {
      const parsedEndDate = new Date(input.endDate);
      if (Number.isNaN(parsedEndDate.valueOf())) {
        throw new Error("End date is invalid");
      }
    }
    if (input.date && input.endDate) {
      const parsedDate = new Date(input.date);
      const parsedEndDate = new Date(input.endDate);
      if (!Number.isNaN(parsedDate.valueOf()) && parsedEndDate < parsedDate) {
        throw new Error("End date must be after start date");
      }
    }
    return input;
  })
  .handler(async ({ data }): Promise<CalendarEventResponse> => {
    const convex = await getConvexClient();
    const event = await convex.mutation(internal.calendar.updateCalendarEvent, {
      id: data.id,
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.description !== undefined
        ? { description: data.description }
        : {}),
      ...(data.date !== undefined ? { date: data.date } : {}),
      ...(data.time !== undefined ? { time: data.time } : {}),
      ...(data.recurrence !== undefined ? { recurrence: data.recurrence } : {}),
      ...(data.endDate !== undefined ? { endDate: data.endDate } : {}),
      ...(data.participantId !== undefined
        ? { participantId: data.participantId }
        : {}),
    });

    return toCalendarEventResponse(event);
  });

export const deleteCalendarEvent = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteCalendarEventInput) => {
    if (!input.id) {
      throw new Error("Event ID is required");
    }
    return input;
  })
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const convex = await getConvexClient();
    return convex.mutation(internal.calendar.deleteCalendarEvent, {
      id: data.id,
    });
  });
