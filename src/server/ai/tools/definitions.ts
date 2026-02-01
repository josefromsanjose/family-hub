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
  }),
  outputSchema: z.string(),
});

export const currentTimeDefinition = toolDefinition({
  name: "current_time",
  description: "Returns the current server time in ISO format. Input must be {}.",
  inputSchema: z.object({}),
  outputSchema: z.string(),
});
