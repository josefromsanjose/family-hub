import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, internalQuery } from "./_generated/server";
import {
  getMemberByIdInHousehold,
  requireHouseholdId,
  requireMember,
} from "./lib/household";
import { generateId } from "./lib/ids";

const taskPriority = v.union(
  v.literal("low"),
  v.literal("medium"),
  v.literal("high")
);
const taskRecurrence = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly")
);
const taskRotationMode = v.union(
  v.literal("none"),
  v.literal("odd_even_week")
);

type DbCtx = QueryCtx | MutationCtx;

async function getTaskByIdInHousehold(
  ctx: DbCtx,
  householdId: string,
  taskId: string
) {
  return ctx.db
    .query("tasks")
    .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
    .filter((q) => q.eq(q.field("id"), taskId))
    .unique();
}

async function assertMembersInHousehold(
  ctx: DbCtx,
  householdId: string,
  memberIds: string[]
) {
  for (const memberId of memberIds) {
    const member = await getMemberByIdInHousehold(ctx, householdId, memberId);
    if (!member) {
      throw new Error("Rotation assignees not found or not authorized");
    }
  }
}

export const getTasks = internalQuery({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx, args.clerkUserId);
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
      .collect();

    tasks.sort((a, b) => b.createdAt - a.createdAt);

    const tasksWithOverrides = await Promise.all(
      tasks.map(async (task) => {
        const overrides = await ctx.db
          .query("taskAssignmentOverrides")
          .withIndex("by_taskId", (q) => q.eq("taskId", task.id))
          .collect();
        overrides.sort((a, b) => a.date - b.date);
        return {
          ...task,
          assignmentOverrides: overrides.map((override) => ({
            date: override.date,
            assignedToId: override.assignedToId,
          })),
        };
      })
    );

    return tasksWithOverrides;
  },
});

export const getCompletionRecords = internalQuery({
  args: { clerkUserId: v.string() },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx, args.clerkUserId);
    const completions = await ctx.db
      .query("completionRecords")
      .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
      .collect();

    completions.sort((a, b) => b.completedAt - a.completedAt);
    return completions;
  },
});

export const createTask = internalMutation({
  args: {
    clerkUserId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    assignedTo: v.optional(v.string()),
    dueDate: v.optional(v.string()),
    priority: v.optional(taskPriority),
    recurrence: v.optional(taskRecurrence),
    recurrenceDays: v.optional(v.array(v.number())),
    recurrenceDayOfMonth: v.optional(v.union(v.null(), v.number())),
    recurrenceWeekday: v.optional(v.union(v.null(), v.number())),
    recurrenceWeekOfMonth: v.optional(v.union(v.null(), v.number())),
    rotationMode: v.optional(taskRotationMode),
    rotationAssignees: v.optional(v.array(v.string())),
    rotationAnchorDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx, args.clerkUserId);

    if (args.assignedTo) {
      const member = await getMemberByIdInHousehold(
        ctx,
        householdId,
        args.assignedTo
      );
      if (!member) {
        throw new Error("Assigned member not found or not authorized");
      }
    }

    if (args.rotationAssignees && args.rotationAssignees.length > 0) {
      await assertMembersInHousehold(
        ctx,
        householdId,
        args.rotationAssignees
      );
    }

    const shouldAnchorRotation =
      args.rotationMode === "odd_even_week" && !args.rotationAnchorDate;

    const now = Date.now();
    const task = {
      id: generateId(),
      householdId,
      title: args.title.trim(),
      description: args.description?.trim() || null,
      assignedToId: args.assignedTo || null,
      dueDate: args.dueDate ? new Date(args.dueDate).valueOf() : null,
      priority: args.priority ?? "medium",
      recurrence: args.recurrence ?? null,
      recurrenceDays: args.recurrenceDays ?? [],
      recurrenceDayOfMonth: args.recurrenceDayOfMonth ?? null,
      recurrenceWeekday: args.recurrenceWeekday ?? null,
      recurrenceWeekOfMonth: args.recurrenceWeekOfMonth ?? null,
      rotationMode: args.rotationMode ?? "none",
      rotationAssignees: args.rotationAssignees ?? [],
      rotationAnchorDate: args.rotationAnchorDate
        ? new Date(args.rotationAnchorDate).valueOf()
        : shouldAnchorRotation
          ? now
          : null,
      completed: false,
      createdAt: now,
      updatedAt: now,
    };

    await ctx.db.insert("tasks", task);
    return { ...task, assignmentOverrides: [] };
  },
});

export const updateTask = internalMutation({
  args: {
    clerkUserId: v.string(),
    id: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.union(v.null(), v.string())),
    assignedTo: v.optional(v.union(v.null(), v.string())),
    dueDate: v.optional(v.union(v.null(), v.string())),
    priority: v.optional(taskPriority),
    recurrence: v.optional(v.union(v.null(), taskRecurrence)),
    completed: v.optional(v.boolean()),
    recurrenceDays: v.optional(v.union(v.null(), v.array(v.number()))),
    recurrenceDayOfMonth: v.optional(v.union(v.null(), v.number())),
    recurrenceWeekday: v.optional(v.union(v.null(), v.number())),
    recurrenceWeekOfMonth: v.optional(v.union(v.null(), v.number())),
    rotationMode: v.optional(taskRotationMode),
    rotationAssignees: v.optional(v.union(v.null(), v.array(v.string()))),
    rotationAnchorDate: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx, args.clerkUserId);
    const existingTask = await getTaskByIdInHousehold(
      ctx,
      householdId,
      args.id
    );

    if (!existingTask) {
      throw new Error("Task not found or not authorized");
    }

    if (args.assignedTo !== undefined && args.assignedTo !== null) {
      const member = await getMemberByIdInHousehold(
        ctx,
        householdId,
        args.assignedTo
      );
      if (!member) {
        throw new Error("Assigned member not found or not authorized");
      }
    }

    if (args.rotationAssignees !== undefined && args.rotationAssignees !== null) {
      if (args.rotationAssignees.length > 0) {
        await assertMembersInHousehold(
          ctx,
          householdId,
          args.rotationAssignees
        );
      }
    }

    const patch = {
      ...(args.title !== undefined && { title: args.title.trim() }),
      ...(args.description !== undefined && {
        description: args.description?.trim() || null,
      }),
      ...(args.assignedTo !== undefined && {
        assignedToId: args.assignedTo || null,
      }),
      ...(args.dueDate !== undefined && {
        dueDate: args.dueDate ? new Date(args.dueDate).valueOf() : null,
      }),
      ...(args.priority !== undefined && { priority: args.priority }),
      ...(args.recurrence !== undefined && { recurrence: args.recurrence }),
      ...(args.recurrenceDays !== undefined && {
        recurrenceDays: args.recurrenceDays ?? [],
      }),
      ...(args.recurrenceDayOfMonth !== undefined && {
        recurrenceDayOfMonth: args.recurrenceDayOfMonth,
      }),
      ...(args.recurrenceWeekday !== undefined && {
        recurrenceWeekday: args.recurrenceWeekday,
      }),
      ...(args.recurrenceWeekOfMonth !== undefined && {
        recurrenceWeekOfMonth: args.recurrenceWeekOfMonth,
      }),
      ...(args.rotationMode !== undefined && {
        rotationMode: args.rotationMode,
      }),
      ...(args.rotationAssignees !== undefined && {
        rotationAssignees: args.rotationAssignees ?? [],
      }),
      ...(args.rotationAnchorDate !== undefined && {
        rotationAnchorDate: args.rotationAnchorDate
          ? new Date(args.rotationAnchorDate).valueOf()
          : null,
      }),
      ...(args.completed !== undefined && { completed: args.completed }),
      updatedAt: Date.now(),
    };

    await ctx.db.patch(existingTask._id, patch);

    const overrides = await ctx.db
      .query("taskAssignmentOverrides")
      .withIndex("by_taskId", (q) => q.eq("taskId", existingTask.id))
      .collect();
    overrides.sort((a, b) => a.date - b.date);

    return {
      ...existingTask,
      ...patch,
      assignmentOverrides: overrides.map((override) => ({
        date: override.date,
        assignedToId: override.assignedToId,
      })),
    };
  },
});

export const deleteTask = internalMutation({
  args: { clerkUserId: v.string(), id: v.string() },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx, args.clerkUserId);
    const existingTask = await getTaskByIdInHousehold(
      ctx,
      householdId,
      args.id
    );

    if (!existingTask) {
      throw new Error("Task not found or not authorized");
    }

    const overrides = await ctx.db
      .query("taskAssignmentOverrides")
      .withIndex("by_taskId", (q) => q.eq("taskId", existingTask.id))
      .collect();
    for (const override of overrides) {
      await ctx.db.delete(override._id);
    }

    const completions = await ctx.db
      .query("completionRecords")
      .withIndex("by_taskId", (q) => q.eq("taskId", existingTask.id))
      .collect();
    for (const completion of completions) {
      await ctx.db.delete(completion._id);
    }

    await ctx.db.delete(existingTask._id);
    return { success: true };
  },
});

export const completeTask = internalMutation({
  args: { clerkUserId: v.string(), taskId: v.string(), completedBy: v.string() },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx, args.clerkUserId);
    const currentMember = await requireMember(ctx, args.clerkUserId);
    const task = await getTaskByIdInHousehold(ctx, householdId, args.taskId);

    if (!task) {
      throw new Error("Task not found or not authorized");
    }

    let memberId = args.completedBy;
    const member = await getMemberByIdInHousehold(ctx, householdId, memberId);
    if (!member) {
      memberId = currentMember.id;
    }

    if (task.recurrence) {
      await ctx.db.insert("completionRecords", {
        id: generateId(),
        householdId,
        taskId: task.id,
        completedAt: Date.now(),
        completedById: memberId,
      });
    } else {
      await ctx.db.patch(task._id, { completed: true, updatedAt: Date.now() });
    }

    return { success: true };
  },
});

export const uncompleteTask = internalMutation({
  args: { clerkUserId: v.string(), taskId: v.string() },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx, args.clerkUserId);
    const task = await getTaskByIdInHousehold(ctx, householdId, args.taskId);

    if (!task) {
      throw new Error("Task not found or not authorized");
    }

    if (task.recurrence) {
      const completions = await ctx.db
        .query("completionRecords")
        .withIndex("by_taskId", (q) => q.eq("taskId", task.id))
        .collect();
      completions.sort((a, b) => b.completedAt - a.completedAt);
      if (completions.length > 0) {
        await ctx.db.delete(completions[0]._id);
      }
    } else {
      await ctx.db.patch(task._id, { completed: false, updatedAt: Date.now() });
    }

    return { success: true };
  },
});
