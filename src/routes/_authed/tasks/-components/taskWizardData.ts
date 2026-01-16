import type { Task, TaskUpdate } from "@/contexts/TasksContext";
import type { TaskData, TaskFrequency } from "./TaskWizard.types";

function toTaskRecurrence(value: TaskFrequency): Task["recurrence"] | undefined {
  if (value === "once") return undefined;
  return value;
}

function toTaskRecurrenceOrNull(
  value: TaskFrequency
): Task["recurrence"] | null {
  if (value === "once") return null;
  return value;
}

export function createEmptyTaskData(): TaskData {
  return {
    title: "",
    assignedTo: null,
    recurrence: "once",
    priority: "medium",
    dueDate: null,
    recurrenceDays: [],
    recurrenceDayOfMonth: null,
    recurrenceWeekday: null,
    recurrenceWeekOfMonth: null,
    monthlyPattern: null,
    rotationMode: "none",
    rotationAssignees: [],
    rotationAnchorDate: null,
  };
}

export function taskToWizardData(task: Task): TaskData {
  const recurrence = task.recurrence ?? "once";
  const isMonthly = recurrence === "monthly";
  const monthlyPattern = isMonthly
    ? task.recurrenceDayOfMonth
      ? "day_of_month"
      : task.recurrenceWeekday !== undefined &&
          task.recurrenceWeekOfMonth !== undefined
        ? "nth_weekday"
        : null
    : null;

  return {
    title: task.title,
    assignedTo: task.assignedTo ?? null,
    recurrence,
    priority: task.priority,
    dueDate:
      recurrence === "once" && task.dueDate ? new Date(task.dueDate) : null,
    recurrenceDays: task.recurrenceDays ?? [],
    recurrenceDayOfMonth: task.recurrenceDayOfMonth ?? null,
    recurrenceWeekday: task.recurrenceWeekday ?? null,
    recurrenceWeekOfMonth: task.recurrenceWeekOfMonth ?? null,
    monthlyPattern,
    rotationMode: task.rotationMode ?? "none",
    rotationAssignees: task.rotationAssignees ?? [],
    rotationAnchorDate: task.rotationAnchorDate
      ? new Date(task.rotationAnchorDate)
      : null,
  };
}

export function wizardDataToTaskCreateInput(
  data: TaskData
): Omit<Task, "id" | "completed"> {
  const isOnce = data.recurrence === "once";
  const isWeekly = data.recurrence === "weekly";
  const isMonthly = data.recurrence === "monthly";
  const isMonthlyDay = isMonthly && data.monthlyPattern === "day_of_month";
  const isMonthlyWeekday = isMonthly && data.monthlyPattern === "nth_weekday";
  const recurrence = toTaskRecurrence(data.recurrence);

  return {
    title: data.title.trim(),
    assignedTo: data.assignedTo || undefined,
    recurrence,
    priority: data.priority,
    dueDate: isOnce && data.dueDate ? data.dueDate.toISOString() : undefined,
    recurrenceDays: isWeekly ? data.recurrenceDays : [],
    recurrenceDayOfMonth: isMonthlyDay
      ? data.recurrenceDayOfMonth ?? undefined
      : undefined,
    recurrenceWeekday: isMonthlyWeekday
      ? data.recurrenceWeekday ?? undefined
      : undefined,
    recurrenceWeekOfMonth: isMonthlyWeekday
      ? data.recurrenceWeekOfMonth ?? undefined
      : undefined,
    rotationMode: isWeekly ? data.rotationMode : "none",
    rotationAssignees: isWeekly ? data.rotationAssignees : [],
    rotationAnchorDate:
      isWeekly && data.rotationMode === "odd_even_week" && data.rotationAnchorDate
        ? data.rotationAnchorDate.toISOString()
        : undefined,
    assignmentOverrides: [],
  };
}

export function wizardDataToTaskUpdateInput(data: TaskData): TaskUpdate {
  const isOnce = data.recurrence === "once";
  const isWeekly = data.recurrence === "weekly";
  const isMonthly = data.recurrence === "monthly";
  const isMonthlyDay = isMonthly && data.monthlyPattern === "day_of_month";
  const isMonthlyWeekday = isMonthly && data.monthlyPattern === "nth_weekday";

  return {
    title: data.title.trim(),
    assignedTo: data.assignedTo ?? null,
    recurrence: toTaskRecurrenceOrNull(data.recurrence),
    priority: data.priority,
    dueDate: isOnce ? data.dueDate?.toISOString() ?? null : null,
    recurrenceDays: isWeekly ? data.recurrenceDays : [],
    recurrenceDayOfMonth: isMonthlyDay
      ? data.recurrenceDayOfMonth ?? null
      : null,
    recurrenceWeekday: isMonthlyWeekday ? data.recurrenceWeekday ?? null : null,
    recurrenceWeekOfMonth: isMonthlyWeekday
      ? data.recurrenceWeekOfMonth ?? null
      : null,
    rotationMode: isWeekly ? data.rotationMode : "none",
    rotationAssignees: isWeekly ? data.rotationAssignees : [],
    rotationAnchorDate:
      isWeekly && data.rotationMode === "odd_even_week"
        ? (data.rotationAnchorDate ?? new Date()).toISOString()
        : null,
  };
}
