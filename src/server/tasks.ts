import { createServerFn } from "@tanstack/react-start";
import type {
  TaskPriority,
  TaskRecurrence,
  TaskRotationMode,
} from "@prisma/client";
import { getPrisma } from "@/server/db";

// ============================================================================
// Helper Functions
// ============================================================================

// Helper to get current user's household ID
async function getCurrentUserHouseholdId(): Promise<string> {
  const { auth } = await import("@clerk/tanstack-react-start/server");
  const { userId } = await auth();
  const prisma = await getPrisma();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const member = await prisma.householdMember.findUnique({
    where: { clerkUserId: userId },
    select: { householdId: true },
  });

  if (!member) {
    throw new Error("No household found for user");
  }

  return member.householdId;
}

// Helper to get current user's member ID
async function getCurrentUserMemberId(): Promise<string> {
  const { auth } = await import("@clerk/tanstack-react-start/server");
  const { userId } = await auth();
  const prisma = await getPrisma();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const member = await prisma.householdMember.findUnique({
    where: { clerkUserId: userId },
    select: { id: true },
  });

  if (!member) {
    throw new Error("No household member found for user");
  }

  return member.id;
}

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
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    const tasks = await prisma.task.findMany({
      where: { householdId },
      include: {
        assignedTo: true,
        assignmentOverrides: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      assignedTo: task.assignedToId || undefined,
      dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
      completed: task.completed,
      priority: task.priority as "low" | "medium" | "high",
      recurrence:
        (task.recurrence as "daily" | "weekly" | "monthly" | null) || undefined,
      recurrenceDays: task.recurrenceDays ?? [],
      recurrenceDayOfMonth: task.recurrenceDayOfMonth ?? undefined,
      recurrenceWeekday: task.recurrenceWeekday ?? undefined,
      recurrenceWeekOfMonth: task.recurrenceWeekOfMonth ?? undefined,
      rotationMode:
        (task.rotationMode as "none" | "odd_even_week" | null) || "none",
      rotationAssignees: task.rotationAssignees ?? [],
      rotationAnchorDate: task.rotationAnchorDate
        ? task.rotationAnchorDate.toISOString()
        : undefined,
      assignmentOverrides: task.assignmentOverrides.map((override) => ({
        date: override.date.toISOString(),
        assignedTo: override.assignedToId,
      })),
    }));
  }
);

// GET: Fetch all completion records for the current user's household
export const getCompletionRecords = createServerFn({ method: "GET" }).handler(
  async (): Promise<CompletionRecordResponse[]> => {
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    const completions = await prisma.completionRecord.findMany({
      where: { householdId },
      orderBy: { completedAt: "desc" },
    });

    return completions.map((completion) => ({
      id: completion.id,
      taskId: completion.taskId,
      completedAt: completion.completedAt.toISOString(),
      completedBy: completion.completedById,
    }));
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
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    // Verify assignedTo member belongs to household if provided
    if (data.assignedTo) {
      const member = await prisma.householdMember.findFirst({
        where: {
          id: data.assignedTo,
          householdId,
        },
      });

      if (!member) {
        throw new Error("Assigned member not found or not authorized");
      }
    }
    if (data.rotationAssignees && data.rotationAssignees.length > 0) {
      const count = await prisma.householdMember.count({
        where: {
          id: { in: data.rotationAssignees },
          householdId,
        },
      });
      if (count !== data.rotationAssignees.length) {
        throw new Error("Rotation assignees not found or not authorized");
      }
    }

    const shouldAnchorRotation =
      data.rotationMode === "odd_even_week" && !data.rotationAnchorDate;

    const task = await prisma.task.create({
      data: {
        householdId,
        title: data.title.trim(),
        description: data.description?.trim() || null,
        assignedToId: data.assignedTo || null,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        priority: (data.priority || "medium") as TaskPriority,
        recurrence: data.recurrence
          ? (data.recurrence as TaskRecurrence)
          : null,
        recurrenceDays: data.recurrenceDays || [],
        recurrenceDayOfMonth: data.recurrenceDayOfMonth || null,
        recurrenceWeekday: data.recurrenceWeekday || null,
        recurrenceWeekOfMonth: data.recurrenceWeekOfMonth || null,
        rotationMode: (data.rotationMode || "none") as TaskRotationMode,
        rotationAssignees: data.rotationAssignees || [],
        rotationAnchorDate: data.rotationAnchorDate
          ? new Date(data.rotationAnchorDate)
          : shouldAnchorRotation
            ? new Date()
            : null,
        completed: false,
      },
      include: {
        assignedTo: true,
        assignmentOverrides: true,
      },
    });

    return {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      assignedTo: task.assignedToId || undefined,
      dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
      completed: task.completed,
      priority: task.priority as "low" | "medium" | "high",
      recurrence:
        (task.recurrence as "daily" | "weekly" | "monthly" | null) || undefined,
      recurrenceDays: task.recurrenceDays ?? [],
      recurrenceDayOfMonth: task.recurrenceDayOfMonth ?? undefined,
      recurrenceWeekday: task.recurrenceWeekday ?? undefined,
      recurrenceWeekOfMonth: task.recurrenceWeekOfMonth ?? undefined,
      rotationMode:
        (task.rotationMode as "none" | "odd_even_week" | null) || "none",
      rotationAssignees: task.rotationAssignees ?? [],
      rotationAnchorDate: task.rotationAnchorDate
        ? task.rotationAnchorDate.toISOString()
        : undefined,
      assignmentOverrides: task.assignmentOverrides.map((override) => ({
        date: override.date.toISOString(),
        assignedTo: override.assignedToId,
      })),
    };
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
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    // Verify the task belongs to the current user's household
    const existingTask = await prisma.task.findFirst({
      where: {
        id: data.id,
        householdId,
      },
    });

    if (!existingTask) {
      throw new Error("Task not found or not authorized");
    }

    // Verify assignedTo member belongs to household if provided
    if (data.assignedTo !== undefined && data.assignedTo !== null) {
      const member = await prisma.householdMember.findFirst({
        where: {
          id: data.assignedTo,
          householdId,
        },
      });

      if (!member) {
        throw new Error("Assigned member not found or not authorized");
      }
    }
    if (
      data.rotationAssignees !== undefined &&
      data.rotationAssignees !== null
    ) {
      if (data.rotationAssignees.length > 0) {
        const count = await prisma.householdMember.count({
          where: {
            id: { in: data.rotationAssignees },
            householdId,
          },
        });
        if (count !== data.rotationAssignees.length) {
          throw new Error("Rotation assignees not found or not authorized");
        }
      }
    }

    const task = await prisma.task.update({
      where: { id: data.id },
      data: {
        ...(data.title !== undefined && { title: data.title.trim() }),
        ...(data.description !== undefined && {
          description: data.description?.trim() || null,
        }),
        ...(data.assignedTo !== undefined && {
          assignedToId: data.assignedTo || null,
        }),
        ...(data.dueDate !== undefined && {
          dueDate: data.dueDate ? new Date(data.dueDate) : null,
        }),
        ...(data.priority !== undefined && {
          priority: data.priority as TaskPriority,
        }),
        ...(data.recurrence !== undefined && {
          recurrence: data.recurrence
            ? (data.recurrence as TaskRecurrence)
            : null,
        }),
        ...(data.recurrenceDays !== undefined && {
          recurrenceDays: data.recurrenceDays || [],
        }),
        ...(data.recurrenceDayOfMonth !== undefined && {
          recurrenceDayOfMonth: data.recurrenceDayOfMonth,
        }),
        ...(data.recurrenceWeekday !== undefined && {
          recurrenceWeekday: data.recurrenceWeekday,
        }),
        ...(data.recurrenceWeekOfMonth !== undefined && {
          recurrenceWeekOfMonth: data.recurrenceWeekOfMonth,
        }),
        ...(data.rotationMode !== undefined && {
          rotationMode: data.rotationMode as TaskRotationMode,
        }),
        ...(data.rotationAssignees !== undefined && {
          rotationAssignees: data.rotationAssignees || [],
        }),
        ...(data.rotationAnchorDate !== undefined && {
          rotationAnchorDate: data.rotationAnchorDate
            ? new Date(data.rotationAnchorDate)
            : null,
        }),
        ...(data.completed !== undefined && { completed: data.completed }),
      },
      include: {
        assignedTo: true,
        assignmentOverrides: true,
      },
    });

    return {
      id: task.id,
      title: task.title,
      description: task.description || undefined,
      assignedTo: task.assignedToId || undefined,
      dueDate: task.dueDate ? task.dueDate.toISOString() : undefined,
      completed: task.completed,
      priority: task.priority as "low" | "medium" | "high",
      recurrence:
        (task.recurrence as "daily" | "weekly" | "monthly" | null) || undefined,
      recurrenceDays: task.recurrenceDays ?? [],
      recurrenceDayOfMonth: task.recurrenceDayOfMonth ?? undefined,
      recurrenceWeekday: task.recurrenceWeekday ?? undefined,
      recurrenceWeekOfMonth: task.recurrenceWeekOfMonth ?? undefined,
      rotationMode:
        (task.rotationMode as "none" | "odd_even_week" | null) || "none",
      rotationAssignees: task.rotationAssignees ?? [],
      rotationAnchorDate: task.rotationAnchorDate
        ? task.rotationAnchorDate.toISOString()
        : undefined,
      assignmentOverrides: task.assignmentOverrides.map((override) => ({
        date: override.date.toISOString(),
        assignedTo: override.assignedToId,
      })),
    };
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
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    // Verify the task belongs to the current user's household
    const existingTask = await prisma.task.findFirst({
      where: {
        id: data.id,
        householdId,
      },
    });

    if (!existingTask) {
      throw new Error("Task not found or not authorized");
    }

    // Cascade delete will handle completion records
    await prisma.task.delete({
      where: { id: data.id },
    });

    return { success: true };
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
    const householdId = await getCurrentUserHouseholdId();
    const currentUserMemberId = await getCurrentUserMemberId();
    const prisma = await getPrisma();

    // Verify the task belongs to the current user's household
    const task = await prisma.task.findFirst({
      where: {
        id: data.taskId,
        householdId,
      },
    });

    if (!task) {
      throw new Error("Task not found or not authorized");
    }

    // Use provided member ID, or fall back to current user's member ID
    let memberId = data.completedBy;

    // Verify the member belongs to the household
    const member = await prisma.householdMember.findFirst({
      where: {
        id: memberId,
        householdId,
      },
    });

    // If member not found, use current user's member ID as fallback
    if (!member) {
      memberId = currentUserMemberId;
    }

    if (task.recurrence) {
      // For recurring tasks, create a completion record
      await prisma.completionRecord.create({
        data: {
          householdId,
          taskId: task.id,
          completedById: memberId,
        },
      });
    } else {
      // For one-time tasks, mark as completed
      await prisma.task.update({
        where: { id: task.id },
        data: { completed: true },
      });
    }

    return { success: true };
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
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    // Verify the task belongs to the current user's household
    const task = await prisma.task.findFirst({
      where: {
        id: data.taskId,
        householdId,
      },
      include: {
        completions: {
          orderBy: { completedAt: "desc" },
          take: 1,
        },
      },
    });

    if (!task) {
      throw new Error("Task not found or not authorized");
    }

    if (task.recurrence) {
      // For recurring tasks, remove the most recent completion
      if (task.completions.length > 0) {
        await prisma.completionRecord.delete({
          where: { id: task.completions[0].id },
        });
      }
    } else {
      // For one-time tasks, mark as incomplete
      await prisma.task.update({
        where: { id: task.id },
        data: { completed: false },
      });
    }

    return { success: true };
  });
