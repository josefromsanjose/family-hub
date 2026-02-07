import { toolDefinition } from "@tanstack/ai";
import { z } from "zod";

export const listTasksDefinition = toolDefinition({
  name: "list_tasks",
  description: "Lists tasks for the current household. Input must be {}.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    total: z.number(),
    tasks: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        completed: z.boolean(),
      })
    ),
  }),
});

export const addTaskDefinition = toolDefinition({
  name: "add_task",
  description: "Creates a new task with a title.",
  inputSchema: z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().min(1).optional(),
    assignedTo: z.string().min(1).optional(),
    dueDate: z.string().min(1).optional(),
    priority: z.enum(["low", "medium", "high"]).optional(),
    recurrence: z.enum(["daily", "weekly", "monthly"]).optional(),
    recurrenceDays: z.array(z.number().int().min(0).max(6)).optional(),
    recurrenceDayOfMonth: z.number().int().min(1).max(31).nullable().optional(),
    recurrenceWeekday: z.number().int().min(0).max(6).nullable().optional(),
    recurrenceWeekOfMonth: z.number().int().min(1).max(5).nullable().optional(),
    rotationMode: z.enum(["none", "odd_even_week"]).optional(),
    rotationAssignees: z.array(z.string().min(1)).optional(),
    rotationAnchorDate: z.string().min(1).nullable().optional(),
  }),
  outputSchema: z.object({
    message: z.string(),
    task: z
      .object({
        id: z.string(),
        title: z.string(),
        completed: z.boolean(),
        description: z.string().optional(),
        assignedTo: z.string().optional(),
        dueDate: z.string().optional(),
        priority: z.enum(["low", "medium", "high"]),
        recurrence: z.enum(["daily", "weekly", "monthly"]).optional(),
        recurrenceDays: z.array(z.number().int()),
        recurrenceDayOfMonth: z.number().int().optional(),
        recurrenceWeekday: z.number().int().optional(),
        recurrenceWeekOfMonth: z.number().int().optional(),
        rotationMode: z.enum(["none", "odd_even_week"]),
        rotationAssignees: z.array(z.string()),
        rotationAnchorDate: z.string().optional(),
        assignmentOverrides: z.array(
          z.object({
            date: z.string(),
            assignedTo: z.string(),
          })
        ),
      })
      .nullable(),
  }),
});

export const currentTimeDefinition = toolDefinition({
  name: "current_time",
  description: "Returns the current server time in ISO format. Input must be {}.",
  inputSchema: z.object({}),
  outputSchema: z.object({
    iso: z.string(),
  }),
});
