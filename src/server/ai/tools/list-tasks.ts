import { getConvexClient } from "@/server/convex";
import { internal } from "../../../../convex/_generated/api";
import { listTasksDefinition } from "./definitions";

export const listTasksTool = listTasksDefinition.server(async () => {
  try {
    const convex = await getConvexClient();
    const tasks = await convex.query(internal.tasks.getTasks, {});
    return {
      total: tasks.length,
      tasks: tasks.map((task) => ({
        id: task.id,
        title: task.title,
        completed: task.completed,
      })),
    };
  } catch (error) {
    console.error("list_tasks tool failed", error);
    return {
      total: 0,
      tasks: [],
    };
  }
});
