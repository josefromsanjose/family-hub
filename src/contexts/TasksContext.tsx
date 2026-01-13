import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

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

const TASKS_STORAGE_KEY = "household-tasks";
const COMPLETIONS_STORAGE_KEY = "task-completions";

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
  const [tasks, setTasks] = useState<Task[]>(() => {
    try {
      const stored = localStorage.getItem(TASKS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch {
      return [];
    }
  });

  const [completions, setCompletions] = useState<CompletionRecord[]>(() => {
    try {
      const stored = localStorage.getItem(COMPLETIONS_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
      return [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem(COMPLETIONS_STORAGE_KEY, JSON.stringify(completions));
  }, [completions]);

  const addTask = (task: Omit<Task, "id" | "completed">) => {
    const newTask: Task = {
      ...task,
      id: Date.now().toString(),
      completed: false,
    };
    setTasks([...tasks, newTask]);
  };

  const updateTask = (id: string, updates: Partial<Task>) => {
    setTasks(tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)));
  };

  const deleteTask = (id: string) => {
    setTasks(tasks.filter((t) => t.id !== id));
    setCompletions(completions.filter((c) => c.taskId !== id));
  };

  const completeTask = (taskId: string, completedBy: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.recurrence) {
      // For recurring tasks, add a completion record
      const newCompletion: CompletionRecord = {
        id: Date.now().toString(),
        taskId,
        completedAt: new Date().toISOString(),
        completedBy,
      };
      setCompletions([...completions, newCompletion]);
    } else {
      // For one-time tasks, just mark as completed
      updateTask(taskId, { completed: true });
    }
  };

  const uncompleteTask = (taskId: string) => {
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    if (task.recurrence) {
      // For recurring tasks, remove the most recent completion
      const taskCompletions = completions
        .filter((c) => c.taskId === taskId)
        .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
      if (taskCompletions.length > 0) {
        setCompletions(
          completions.filter((c) => c.id !== taskCompletions[0].id)
        );
      }
    } else {
      // For one-time tasks, mark as incomplete
      updateTask(taskId, { completed: false });
    }
  };

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
