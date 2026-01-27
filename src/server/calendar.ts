import { createServerFn } from "@tanstack/react-start";
import type { EventRecurrence } from "@prisma/client";
import { getPrisma } from "@/server/db";
import { getCurrentUserHouseholdId } from "@/server/household";

// ============================================================================
// Type Definitions
// ============================================================================

export type CalendarEventResponse = {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  recurrence?: "daily" | "weekly" | "monthly";
  endDate?: string;
  participantId?: string;
};

export type CreateCalendarEventInput = {
  title: string;
  description?: string;
  date: string; // ISO string or YYYY-MM-DD
  time?: string;
  recurrence?: "daily" | "weekly" | "monthly";
  endDate?: string | null;
  participantId?: string | null;
};

export type UpdateCalendarEventInput = {
  id: string;
  title?: string;
  description?: string | null;
  date?: string;
  time?: string | null;
  recurrence?: "daily" | "weekly" | "monthly" | null;
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

const toCalendarEventResponse = (event: {
  id: string;
  title: string;
  description: string | null;
  date: Date;
  time: string | null;
  recurrence: EventRecurrence | null;
  endDate: Date | null;
  participantId: string | null;
}): CalendarEventResponse => ({
  id: event.id,
  title: event.title,
  description: event.description || undefined,
  date: event.date.toISOString(),
  time: event.time || undefined,
  recurrence:
    (event.recurrence as CalendarEventResponse["recurrence"]) || undefined,
  endDate: event.endDate ? event.endDate.toISOString() : undefined,
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
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();
    const filters = data ?? {};
    const startDate = filters.startDate ? new Date(filters.startDate) : null;
    const endDate = filters.endDate ? new Date(filters.endDate) : null;

    const events = await prisma.calendarEvent.findMany({
      where: {
        householdId,
        ...(filters.participantId
          ? { participantId: filters.participantId }
          : {}),
        ...(startDate || endDate
          ? {
              date: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ date: "asc" }, { time: "asc" }],
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
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    if (data.participantId) {
      const member = await prisma.householdMember.findFirst({
        where: {
          id: data.participantId,
          householdId,
        },
      });

      if (!member) {
        throw new Error("Participant not found or not authorized");
      }
    }

    const event = await prisma.calendarEvent.create({
      data: {
        householdId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        date: new Date(data.date),
        time: data.time || null,
        recurrence: data.recurrence
          ? (data.recurrence as EventRecurrence)
          : null,
        endDate: data.endDate ? new Date(data.endDate) : null,
        participantId: data.participantId || null,
      },
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
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    const existingEvent = await prisma.calendarEvent.findFirst({
      where: { id: data.id, householdId },
    });

    if (!existingEvent) {
      throw new Error("Event not found or not authorized");
    }

    if (data.participantId !== undefined && data.participantId !== null) {
      const member = await prisma.householdMember.findFirst({
        where: { id: data.participantId, householdId },
      });

      if (!member) {
        throw new Error("Participant not found or not authorized");
      }
    }

    const event = await prisma.calendarEvent.update({
      where: { id: data.id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && {
          description: data.description?.trim() || null,
        }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.time !== undefined && { time: data.time || null }),
        ...(data.recurrence !== undefined && {
          recurrence: data.recurrence
            ? (data.recurrence as EventRecurrence)
            : null,
        }),
        ...(data.endDate !== undefined && {
          endDate: data.endDate ? new Date(data.endDate) : null,
        }),
        ...(data.participantId !== undefined && {
          participantId: data.participantId || null,
        }),
      },
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
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    const existingEvent = await prisma.calendarEvent.findFirst({
      where: {
        id: data.id,
        householdId,
      },
    });

    if (!existingEvent) {
      throw new Error("Event not found or not authorized");
    }

    await prisma.calendarEvent.delete({
      where: { id: data.id },
    });

    return { success: true };
  });
