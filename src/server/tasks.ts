import { createServerFn } from "@tanstack/react-start";
import { getConvexClient } from "@/server/convex";
import { internal } from "../../convex/_generated/api";

// ============================================================================
// Type Definitions
// ============================================================================

// Type for task returned from API (matches context Task interface)
export type TaskResponse = {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string; // Member ID string
  dueDate?: string; // ISO string
  completed: boolean;
  priority: "low" | "medium" | "high";
  recurrence?: "daily" | "weekly" | "monthly";
  recurrenceDays: number[];
  recurrenceDayOfMonth?: number;
  recurrenceWeekday?: number;
  recurrenceWeekOfMonth?: number;
  rotationMode: "none" | "odd_even_week";
  rotationAssignees: string[];
  rotationAnchorDate?: string;
  assignmentOverrides: {
    date: string;
    assignedTo: string;
  }[];
};

// Type for completion record returned from API
export type CompletionRecordResponse = {
  id: string;
  taskId: string;
  completedAt: string; // ISO string
  completedBy: string; // Member ID string
};

type TaskRecord = {
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
};

type CompletionRecord = {
  id: string;
  taskId: string;
  completedAt: number;
  completedById: string;
};

const toTaskResponse = (task: TaskRecord): TaskResponse => ({
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

const toCompletionResponse = (
  completion: CompletionRecord
): CompletionRecordResponse => ({
  id: completion.id,
  taskId: completion.taskId,
  completedAt: new Date(completion.completedAt).toISOString(),
  completedBy: completion.completedById,
});

// Type for creating a new task
export type CreateTaskInput = {
  title: string;
  description?: string;
  assignedTo?: string; // Member ID
  dueDate?: string; // ISO string
  priority?: "low" | "medium" | "high";
  recurrence?: "daily" | "weekly" | "monthly";
  recurrenceDays?: number[];
  recurrenceDayOfMonth?: number | null;
  recurrenceWeekday?: number | null;
  recurrenceWeekOfMonth?: number | null;
  rotationMode?: "none" | "odd_even_week";
  rotationAssignees?: string[];
  rotationAnchorDate?: string | null;
};

// Type for updating a task
export type UpdateTaskInput = {
  id: string;
  title?: string;
  description?: string;
  assignedTo?: string | null; // Member ID or null to unassign
  dueDate?: string | null; // ISO string or null
  priority?: "low" | "medium" | "high";
  recurrence?: "daily" | "weekly" | "monthly" | null;
  completed?: boolean;
  recurrenceDays?: number[] | null;
  recurrenceDayOfMonth?: number | null;
  recurrenceWeekday?: number | null;
  recurrenceWeekOfMonth?: number | null;
  rotationMode?: "none" | "odd_even_week";
  rotationAssignees?: string[] | null;
  rotationAnchorDate?: string | null;
};

// ============================================================================
// GET Operations
// ============================================================================

// GET: Fetch all tasks for the current user's household
export const getTasks = createServerFn({ method: "GET" }).handler(
  async (): Promise<TaskResponse[]> => {
    const convex = await getConvexClient();
    const tasks = await convex.query(internal.tasks.getTasks, {});

    return tasks.map(toTaskResponse);
  }
);

// GET: Fetch all completion records for the current user's household
export const getCompletionRecords = createServerFn({ method: "GET" }).handler(
  async (): Promise<CompletionRecordResponse[]> => {
    const convex = await getConvexClient();
    const completions = await convex.query(
      internal.tasks.getCompletionRecords,
      {}
    );

    return completions.map(toCompletionResponse);
  }
);

// ============================================================================
// POST Operations
// ============================================================================

// POST: Create a new task
export const createTask = createServerFn({ method: "POST" })
  .inputValidator((input: CreateTaskInput) => {
    if (!input.title || input.title.trim().length === 0) {
      throw new Error("Title is required");
    }
    return input;
  })
  .handler(async ({ data }): Promise<TaskResponse> => {
    const convex = await getConvexClient();
    const task = await convex.mutation(internal.tasks.createTask, {
      title: data.title.trim(),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.assignedTo ? { assignedTo: data.assignedTo } : {}),
      ...(data.dueDate ? { dueDate: data.dueDate } : {}),
      ...(data.priority ? { priority: data.priority } : {}),
      ...(data.recurrence ? { recurrence: data.recurrence } : {}),
      ...(data.recurrenceDays ? { recurrenceDays: data.recurrenceDays } : {}),
      ...(data.recurrenceDayOfMonth !== undefined
        ? { recurrenceDayOfMonth: data.recurrenceDayOfMonth }
        : {}),
      ...(data.recurrenceWeekday !== undefined
        ? { recurrenceWeekday: data.recurrenceWeekday }
        : {}),
      ...(data.recurrenceWeekOfMonth !== undefined
        ? { recurrenceWeekOfMonth: data.recurrenceWeekOfMonth }
        : {}),
      ...(data.rotationMode ? { rotationMode: data.rotationMode } : {}),
      ...(data.rotationAssignees
        ? { rotationAssignees: data.rotationAssignees }
        : {}),
      ...(data.rotationAnchorDate
        ? { rotationAnchorDate: data.rotationAnchorDate }
        : {}),
    });

    return toTaskResponse(task);
  });

// POST: Update an existing task
export const updateTask = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateTaskInput) => {
    if (!input.id) {
      throw new Error("Task ID is required");
    }
    return input;
  })
  .handler(async ({ data }): Promise<TaskResponse> => {
    const convex = await getConvexClient();
    const task = await convex.mutation(internal.tasks.updateTask, {
      id: data.id,
      ...(data.title !== undefined && { title: data.title.trim() }),
      ...(data.description !== undefined ? { description: data.description } : {}),
      ...(data.assignedTo !== undefined ? { assignedTo: data.assignedTo } : {}),
      ...(data.dueDate !== undefined ? { dueDate: data.dueDate } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
      ...(data.recurrence !== undefined ? { recurrence: data.recurrence } : {}),
      ...(data.completed !== undefined ? { completed: data.completed } : {}),
      ...(data.recurrenceDays !== undefined
        ? { recurrenceDays: data.recurrenceDays }
        : {}),
      ...(data.recurrenceDayOfMonth !== undefined
        ? { recurrenceDayOfMonth: data.recurrenceDayOfMonth }
        : {}),
      ...(data.recurrenceWeekday !== undefined
        ? { recurrenceWeekday: data.recurrenceWeekday }
        : {}),
      ...(data.recurrenceWeekOfMonth !== undefined
        ? { recurrenceWeekOfMonth: data.recurrenceWeekOfMonth }
        : {}),
      ...(data.rotationMode !== undefined
        ? { rotationMode: data.rotationMode }
        : {}),
      ...(data.rotationAssignees !== undefined
        ? { rotationAssignees: data.rotationAssignees }
        : {}),
      ...(data.rotationAnchorDate !== undefined
        ? { rotationAnchorDate: data.rotationAnchorDate }
        : {}),
    });

    return toTaskResponse(task);
  });

// POST: Delete a task
export type DeleteTaskInput = {
  id: string;
};

export const deleteTask = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteTaskInput) => {
    if (!input.id) {
      throw new Error("Task ID is required");
    }
    return input;
  })
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const convex = await getConvexClient();
    return convex.mutation(internal.tasks.deleteTask, {
      id: data.id,
    });
  });

// POST: Complete a task (creates completion record for recurring, marks complete for one-time)
export type CompleteTaskInput = {
  taskId: string;
  completedBy: string; // Member ID
};

export const completeTask = createServerFn({ method: "POST" })
  .inputValidator((input: CompleteTaskInput) => {
    if (!input.taskId) {
      throw new Error("Task ID is required");
    }
    if (!input.completedBy) {
      throw new Error("Completed by member ID is required");
    }
    return input;
  })
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const convex = await getConvexClient();
    return convex.mutation(internal.tasks.completeTask, {
      taskId: data.taskId,
      completedBy: data.completedBy,
    });
  });

// POST: Uncomplete a task (removes most recent completion for recurring, marks incomplete for one-time)
export type UncompleteTaskInput = {
  taskId: string;
};

export const uncompleteTask = createServerFn({ method: "POST" })
  .inputValidator((input: UncompleteTaskInput) => {
    if (!input.taskId) {
      throw new Error("Task ID is required");
    }
    return input;
  })
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const convex = await getConvexClient();
    return convex.mutation(internal.tasks.uncompleteTask, {
      taskId: data.taskId,
    });
  });
