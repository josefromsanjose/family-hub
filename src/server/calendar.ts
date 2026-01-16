import { createServerFn } from "@tanstack/react-start";
import type { EventType, EventRecurrence } from "@prisma/client";
import { getPrisma } from "@/server/db";

// ============================================================================
// Helper Functions
// ============================================================================

async function getCurrentUserHouseholdId(): Promise<string> {
  const { auth } = await import("@clerk/tanstack-react-start/server");
  const { userId } = await auth();
  const prisma = await getPrisma();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const member = await prisma.householdMember.findUnique({
    where: { clerkUserId: userId },
    select: { householdId: true },
  });

  if (!member) {
    throw new Error("No household found for user");
  }

  return member.householdId;
}

// ============================================================================
// Type Definitions
// ============================================================================

export type CalendarEventResponse = {
  id: string;
  title: string;
  description?: string;
  date: string;
  time?: string;
  type: "appointment" | "event" | "reminder";
  recurrence?: "daily" | "weekly" | "monthly";
  participantId?: string;
};

export type CreateCalendarEventInput = {
  title: string;
  description?: string;
  date: string; // ISO string or YYYY-MM-DD
  time?: string;
  type: "appointment" | "event" | "reminder";
  recurrence?: "daily" | "weekly" | "monthly";
  participantId?: string | null;
};

export type DeleteCalendarEventInput = {
  id: string;
};

// ============================================================================
// GET Operations
// ============================================================================

export const getCalendarEvents = createServerFn({ method: "GET" }).handler(
  async (): Promise<CalendarEventResponse[]> => {
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    const events = await prisma.calendarEvent.findMany({
      where: { householdId },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });

    return events.map((event) => ({
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      date: event.date.toISOString(),
      time: event.time || undefined,
      type: event.type as CalendarEventResponse["type"],
      recurrence:
        (event.recurrence as CalendarEventResponse["recurrence"]) || undefined,
      participantId: event.participantId || undefined,
    }));
  }
);

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
        type: data.type as EventType,
        recurrence: data.recurrence
          ? (data.recurrence as EventRecurrence)
          : null,
        participantId: data.participantId || null,
      },
    });

    return {
      id: event.id,
      title: event.title,
      description: event.description || undefined,
      date: event.date.toISOString(),
      time: event.time || undefined,
      type: event.type as CalendarEventResponse["type"],
      recurrence:
        (event.recurrence as CalendarEventResponse["recurrence"]) || undefined,
      participantId: event.participantId || undefined,
    };
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
