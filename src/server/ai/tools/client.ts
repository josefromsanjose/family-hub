import { clientTools } from "@tanstack/ai-client";
import { getTasks, createTask } from "@/server/tasks";
import type { CreateTaskInput } from "@/server/tasks";
import {
  addTaskDefinition,
  currentTimeDefinition,
  listTasksDefinition,
} from "./definitions";

export const getChatClientTools = () =>
  clientTools(
    listTasksDefinition.client(async () => {
      const tasks = await getTasks();
      return {
        total: tasks.length,
        tasks: tasks.map((task) => ({
          id: task.id,
          title: task.title,
          completed: task.completed,
        })),
      };
    }),
    addTaskDefinition.client(async (args) => {
      const input = addTaskDefinition.inputSchema
        ? addTaskDefinition.inputSchema.parse(args)
        : (args as CreateTaskInput);
      const hasAssignmentInput =
        !!input.assignedTo ||
        (Array.isArray(input.rotationAssignees) &&
          input.rotationAssignees.length > 0) ||
        (!!input.rotationMode && input.rotationMode !== "none") ||
        !!input.rotationAnchorDate;
      const task = await createTask({
        data: {
          title: input.title,
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
        },
      });
      return {
        message: hasAssignmentInput
          ? `Created task "${task.title}". Assignment fields are ignored by the agent right now.`
          : `Created task "${task.title}".`,
        task,
      };
    }),
    currentTimeDefinition.client(async () => ({
      iso: new Date().toISOString(),
    }))
  );
