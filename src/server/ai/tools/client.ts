import { clientTools } from "@tanstack/ai-client";
import { getTasks, createTask } from "@/server/tasks";
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
        : (args as { title: string });
      const task = await createTask({ data: { title: input.title } });
      return `Created task "${task.title}".`;
    }),
    currentTimeDefinition.client(async () => new Date().toISOString())
  );
