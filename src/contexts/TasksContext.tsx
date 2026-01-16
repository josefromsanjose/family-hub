import { createContext, useContext, useCallback, ReactNode } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getTasks,
  getCompletionRecords,
  createTask,
  updateTask as updateTaskServer,
  deleteTask as deleteTaskServer,
  completeTask as completeTaskServer,
  uncompleteTask as uncompleteTaskServer,
  type CreateTaskInput,
  type UpdateTaskInput,
  type DeleteTaskInput,
  type CompleteTaskInput,
  type UncompleteTaskInput,
} from "@/server/tasks";
import { useHousehold } from "@/contexts/HouseholdContext";

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignedTo?: string;
  dueDate?: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  recurrence?: "daily" | "weekly" | "monthly";
}

export interface CompletionRecord {
  id: string;
  taskId: string;
  completedAt: string;
  completedBy: string;
}

interface TasksContextType {
  tasks: Task[];
  completions: CompletionRecord[];
  addTask: (task: Omit<Task, "id" | "completed">) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (taskId: string, completedBy: string) => void;
  uncompleteTask: (taskId: string) => void;
  isTaskDue: (task: Task) => boolean;
  getCompletionsForTask: (taskId: string) => CompletionRecord[];
  getCompletionsThisPeriod: (task: Task) => CompletionRecord[];
  getCompletionStreak: (task: Task) => number;
}

const TasksContext = createContext<TasksContextType | undefined>(undefined);

function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

function isSameWeek(date1: Date, date2: Date): boolean {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays < 7 && d1.getDay() <= d2.getDay();
}

function isSameMonth(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth()
  );
}

export function TasksProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { members } = useHousehold();

  // Fetch tasks with TanStack Query
  const { data: tasksData = [] } = useQuery({
    queryKey: ["tasks"],
    queryFn: () => getTasks(),
  });

  // Fetch completions with TanStack Query
  const { data: completionsData = [] } = useQuery({
    queryKey: ["completions"],
    queryFn: () => getCompletionRecords(),
  });

  // Map server responses to context types (they're already compatible, but ensure consistency)
  const tasks: Task[] = tasksData;
  const completions: CompletionRecord[] = completionsData;

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createTask,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateTaskServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteTaskServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["completions"] });
    },
  });

  // Complete mutation
  const completeMutation = useMutation({
    mutationFn: completeTaskServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["completions"] });
    },
  });

  // Uncomplete mutation
  const uncompleteMutation = useMutation({
    mutationFn: uncompleteTaskServer,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["completions"] });
    },
  });

  const addTask = useCallback(
    (task: Omit<Task, "id" | "completed">) => {
      const input: CreateTaskInput = {
        title: task.title,
        description: task.description,
        assignedTo: task.assignedTo,
        dueDate: task.dueDate,
        priority: task.priority,
        recurrence: task.recurrence,
      };
      createMutation.mutate({ data: input });
    },
    [createMutation]
  );

  const updateTask = useCallback(
    (id: string, updates: Partial<Task>) => {
      const input: UpdateTaskInput = {
        id,
        ...(updates.title !== undefined && { title: updates.title }),
        ...(updates.description !== undefined && {
          description: updates.description,
        }),
        ...(updates.assignedTo !== undefined && {
          assignedTo: updates.assignedTo || null,
        }),
        ...(updates.dueDate !== undefined && {
          dueDate: updates.dueDate || null,
        }),
        ...(updates.priority !== undefined && { priority: updates.priority }),
        ...(updates.recurrence !== undefined && {
          recurrence: updates.recurrence || null,
        }),
        ...(updates.completed !== undefined && {
          completed: updates.completed,
        }),
      };
      updateMutation.mutate({ data: input });
    },
    [updateMutation]
  );

  const deleteTask = useCallback(
    (id: string) => {
      const input: DeleteTaskInput = { id };
      deleteMutation.mutate({ data: input });
    },
    [deleteMutation]
  );

  const completeTask = useCallback(
    (taskId: string, completedBy: string) => {
      // Convert member name to ID if needed (for backward compatibility)
      let memberId = completedBy;
      const member = members.find((m) => m.name === completedBy);
      if (member) {
        memberId = member.id;
      }

      const input: CompleteTaskInput = {
        taskId,
        completedBy: memberId,
      };
      completeMutation.mutate({ data: input });
    },
    [completeMutation, members]
  );

  const uncompleteTask = useCallback(
    (taskId: string) => {
      const input: UncompleteTaskInput = { taskId };
      uncompleteMutation.mutate({ data: input });
    },
    [uncompleteMutation]
  );

  const isTaskDue = (task: Task): boolean => {
    if (!task.recurrence) {
      // One-time task is due if not completed
      return !task.completed;
    }

    // Recurring task: check if it's been completed in the current period
    const taskCompletions = completions
      .filter((c) => c.taskId === task.id)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));

    if (taskCompletions.length === 0) return true;

    const lastCompletion = new Date(taskCompletions[0].completedAt);
    const now = new Date();

    switch (task.recurrence) {
      case "daily":
        return !isSameDay(lastCompletion, now);
      case "weekly":
        return !isSameWeek(lastCompletion, now);
      case "monthly":
        return !isSameMonth(lastCompletion, now);
      default:
        return true;
    }
  };

  const getCompletionsForTask = (taskId: string): CompletionRecord[] => {
    return completions
      .filter((c) => c.taskId === taskId)
      .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  };

  const getCompletionsThisPeriod = (task: Task): CompletionRecord[] => {
    if (!task.recurrence) return [];

    const now = new Date();
    const taskCompletions = getCompletionsForTask(task.id);

    return taskCompletions.filter((c) => {
      const completionDate = new Date(c.completedAt);
      switch (task.recurrence) {
        case "daily":
          return isSameDay(completionDate, now);
        case "weekly":
          return isSameWeek(completionDate, now);
        case "monthly":
          return isSameMonth(completionDate, now);
        default:
          return false;
      }
    });
  };

  const getCompletionStreak = (task: Task): number => {
    if (!task.recurrence) return 0;

    const taskCompletions = getCompletionsForTask(task.id);
    if (taskCompletions.length === 0) return 0;

    const now = new Date();
    let streak = 0;
    let checkDate = new Date(now);

    // For daily, check each day backwards
    if (task.recurrence === "daily") {
      for (let i = 0; i < 365; i++) {
        const dayCompletions = taskCompletions.filter((c) => {
          const cDate = new Date(c.completedAt);
          return isSameDay(cDate, checkDate);
        });
        if (dayCompletions.length > 0) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }
    // For weekly/monthly, simpler check
    else {
      const periods = task.recurrence === "weekly" ? 52 : 12;
      for (let i = 0; i < periods; i++) {
        const periodCompletions = taskCompletions.filter((c) => {
          const cDate = new Date(c.completedAt);
          if (task.recurrence === "weekly") {
            return isSameWeek(cDate, checkDate);
          } else {
            return isSameMonth(cDate, checkDate);
          }
        });
        if (periodCompletions.length > 0) {
          streak++;
          if (task.recurrence === "weekly") {
            checkDate.setDate(checkDate.getDate() - 7);
          } else {
            checkDate.setMonth(checkDate.getMonth() - 1);
          }
        } else {
          break;
        }
      }
    }

    return streak;
  };

  return (
    <TasksContext.Provider
      value={{
        tasks,
        completions,
        addTask,
        updateTask,
        deleteTask,
        completeTask,
        uncompleteTask,
        isTaskDue,
        getCompletionsForTask,
        getCompletionsThisPeriod,
        getCompletionStreak,
      }}
    >
      {children}
    </TasksContext.Provider>
  );
}

export function useTasks() {
  const context = useContext(TasksContext);
  if (context === undefined) {
    throw new Error("useTasks must be used within a TasksProvider");
  }
  return context;
}
