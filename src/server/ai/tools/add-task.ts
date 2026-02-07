import { getConvexClient } from "@/server/convex";
import type { CreateTaskInput } from "@/server/tasks";
import { internal } from "../../../../convex/_generated/api";
import { addTaskDefinition } from "./definitions";

const toTaskResponse = (task: {
  id: string;
  title: string;
  description: string | null;
  assignedToId: string | null;
  dueDate: number | null;
  priority: "low" | "medium" | "high";
  recurrence: "daily" | "weekly" | "monthly" | null;
  recurrenceDays: number[];
  recurrenceDayOfMonth: number | null;
  recurrenceWeekday: number | null;
  recurrenceWeekOfMonth: number | null;
  rotationMode: "none" | "odd_even_week";
  rotationAssignees: string[];
  rotationAnchorDate: number | null;
  completed: boolean;
  assignmentOverrides: {
    date: number;
    assignedToId: string;
  }[];
}) => ({
  id: task.id,
  title: task.title,
  description: task.description || undefined,
  assignedTo: task.assignedToId || undefined,
  dueDate: task.dueDate ? new Date(task.dueDate).toISOString() : undefined,
  completed: task.completed,
  priority: task.priority,
  recurrence: task.recurrence || undefined,
  recurrenceDays: task.recurrenceDays ?? [],
  recurrenceDayOfMonth: task.recurrenceDayOfMonth ?? undefined,
  recurrenceWeekday: task.recurrenceWeekday ?? undefined,
  recurrenceWeekOfMonth: task.recurrenceWeekOfMonth ?? undefined,
  rotationMode: task.rotationMode,
  rotationAssignees: task.rotationAssignees ?? [],
  rotationAnchorDate: task.rotationAnchorDate
    ? new Date(task.rotationAnchorDate).toISOString()
    : undefined,
  assignmentOverrides: task.assignmentOverrides.map((override) => ({
    date: new Date(override.date).toISOString(),
    assignedTo: override.assignedToId,
  })),
});

export const addTaskTool = addTaskDefinition.server(async (args) => {
  const input = addTaskDefinition.inputSchema
    ? addTaskDefinition.inputSchema.parse(args)
    : (args as CreateTaskInput);
  const title = input.title.trim();
  const hasAssignmentInput =
    !!input.assignedTo ||
    (Array.isArray(input.rotationAssignees) &&
      input.rotationAssignees.length > 0) ||
    (!!input.rotationMode && input.rotationMode !== "none") ||
    !!input.rotationAnchorDate;
  if (!title) {
    return {
      message: "Missing task title. Provide a title for add_task.",
      task: null,
    };
  }
  try {
    const convex = await getConvexClient();
    const task = await convex.mutation(internal.tasks.createTask, {
      title,
      ...(input.description ? { description: input.description } : {}),
      ...(input.dueDate ? { dueDate: input.dueDate } : {}),
      ...(input.priority ? { priority: input.priority } : {}),
      ...(input.recurrence ? { recurrence: input.recurrence } : {}),
      ...(input.recurrenceDays !== undefined
        ? { recurrenceDays: input.recurrenceDays }
        : {}),
      ...(input.recurrenceDayOfMonth !== undefined
        ? { recurrenceDayOfMonth: input.recurrenceDayOfMonth }
        : {}),
      ...(input.recurrenceWeekday !== undefined
        ? { recurrenceWeekday: input.recurrenceWeekday }
        : {}),
      ...(input.recurrenceWeekOfMonth !== undefined
        ? { recurrenceWeekOfMonth: input.recurrenceWeekOfMonth }
        : {}),
    });
    return {
      message: hasAssignmentInput
        ? `Created task "${task.title}". Assignment fields are ignored by the agent right now.`
        : `Created task "${task.title}".`,
      task: toTaskResponse(task),
    };
  } catch (error) {
    console.error("add_task tool failed", error);
    return {
      message: "Unable to create the task right now.",
      task: null,
    };
  }
});
