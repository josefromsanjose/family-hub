import { getConvexClient } from "@/server/convex";
import { internal } from "../../../../convex/_generated/api";
import { addTaskDefinition } from "./definitions";

export const addTaskTool = addTaskDefinition.server(async (args) => {
  const title =
    typeof (args as { title?: unknown }).title === "string"
      ? (args as { title?: string }).title?.trim()
      : "";
  if (!title) {
    return JSON.stringify("Missing task title. Provide a title for add_task.");
  }
  try {
    const convex = await getConvexClient();
    const task = await convex.mutation(internal.tasks.createTask, { title });
    return JSON.stringify(`Created task "${task.title}".`);
  } catch (error) {
    console.error("add_task tool failed", error);
    return JSON.stringify("Unable to create the task right now.");
  }
});
