import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, internalQuery } from "./_generated/server";
import { getMemberByIdInHousehold, requireHouseholdId } from "./lib/household";
import { generateId } from "./lib/ids";

type DbCtx = QueryCtx | MutationCtx;

const eventRecurrence = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("yearly")
);

async function getEventByIdInHousehold(
  ctx: DbCtx,
  householdId: string,
  eventId: string
) {
  return ctx.db
    .query("calendarEvents")
    .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
    .filter((q) => q.eq(q.field("id"), eventId))
    .unique();
}

export const getCalendarEvents = internalQuery({
  args: {
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
    participantId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx);
    const startDate = args.startDate ? new Date(args.startDate).valueOf() : null;
    const endDate = args.endDate ? new Date(args.endDate).valueOf() : null;

    const events = await ctx.db
      .query("calendarEvents")
      .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
      .collect();

    const filtered = events.filter((event) => {
      if (args.participantId && event.participantId !== args.participantId) {
        return false;
      }
      if (startDate !== null && event.date < startDate) return false;
      if (endDate !== null && event.date > endDate) return false;
      return true;
    });

    filtered.sort((a, b) => {
      if (a.date !== b.date) return a.date - b.date;
      return (a.time || "").localeCompare(b.time || "");
    });

    return filtered;
  },
});

export const createCalendarEvent = internalMutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    date: v.string(),
    time: v.optional(v.string()),
    recurrence: v.optional(eventRecurrence),
    endDate: v.optional(v.union(v.null(), v.string())),
    participantId: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx);

    if (args.participantId) {
      const member = await getMemberByIdInHousehold(
        ctx,
        householdId,
        args.participantId
      );
      if (!member) {
        throw new Error("Participant not found or not authorized");
      }
    }

    const now = Date.now();
    const event = {
      id: generateId(),
      householdId,
      title: args.title.trim(),
      description: args.description?.trim() || null,
      date: new Date(args.date).valueOf(),
      time: args.time || null,
      recurrence: args.recurrence ?? null,
      endDate: args.endDate ? new Date(args.endDate).valueOf() : null,
      participantId: args.participantId || null,
      createdAt: now,
      updatedAt: now,
    };

    await ctx.db.insert("calendarEvents", event);
    return event;
  },
});

export const updateCalendarEvent = internalMutation({
  args: {
    id: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.union(v.null(), v.string())),
    date: v.optional(v.string()),
    time: v.optional(v.union(v.null(), v.string())),
    recurrence: v.optional(v.union(v.null(), eventRecurrence)),
    endDate: v.optional(v.union(v.null(), v.string())),
    participantId: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx);
    const existingEvent = await getEventByIdInHousehold(
      ctx,
      householdId,
      args.id
    );

    if (!existingEvent) {
      throw new Error("Event not found or not authorized");
    }

    if (args.participantId !== undefined && args.participantId !== null) {
      const member = await getMemberByIdInHousehold(
        ctx,
        householdId,
        args.participantId
      );
      if (!member) {
        throw new Error("Participant not found or not authorized");
      }
    }

    const patch = {
      ...(args.title !== undefined && { title: args.title.trim() }),
      ...(args.description !== undefined && {
        description: args.description?.trim() || null,
      }),
      ...(args.date !== undefined && {
        date: new Date(args.date).valueOf(),
      }),
      ...(args.time !== undefined && { time: args.time || null }),
      ...(args.recurrence !== undefined && { recurrence: args.recurrence }),
      ...(args.endDate !== undefined && {
        endDate: args.endDate ? new Date(args.endDate).valueOf() : null,
      }),
      ...(args.participantId !== undefined && {
        participantId: args.participantId || null,
      }),
      updatedAt: Date.now(),
    };

    await ctx.db.patch(existingEvent._id, patch);
    return { ...existingEvent, ...patch };
  },
});

export const deleteCalendarEvent = internalMutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx);
    const existingEvent = await getEventByIdInHousehold(
      ctx,
      householdId,
      args.id
    );

    if (!existingEvent) {
      throw new Error("Event not found or not authorized");
    }

    await ctx.db.delete(existingEvent._id);
    return { success: true };
  },
});
