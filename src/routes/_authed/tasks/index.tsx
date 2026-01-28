import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Plus,
  Trash2,
  CheckCircle2,
  Circle,
  User,
  Repeat,
  Pencil,
} from "lucide-react";
import { useTasks, Task } from "@/contexts/TasksContext";
import { useHousehold } from "@/contexts/HouseholdContext";

export const Route = createFileRoute("/_authed/tasks/")({
  component: TasksAndChores,
});

function TasksAndChores() {
  const {
    tasks,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    isTaskDue,
    isTaskScheduledForDate,
    getTaskAssigneeForDate,
    getCompletionsThisPeriod,
  } = useTasks();
  const { members } = useHousehold();
  const [filter, setFilter] = useState<
    "all" | "active" | "completed" | "recurring" | "one-time"
  >("all");

  // Helper function to get member name by ID
  const getMemberName = (memberId: string | undefined): string | undefined => {
    if (!memberId) return undefined;
    return members.find((m) => m.id === memberId)?.name;
  };

  const handleToggleTask = (task: Task) => {
    const resolvedAssignee = getTaskAssigneeForDate(task, new Date());
    if (task.recurrence) {
      // For recurring tasks, check if it's due
      if (isTaskDue(task)) {
        completeTask(task.id, resolvedAssignee || task.assignedTo || "Unknown");
      } else {
        uncompleteTask(task.id);
      }
    } else {
      // For one-time tasks
      if (task.completed) {
        updateTask(task.id, { completed: false });
      } else {
        updateTask(task.id, { completed: true });
      }
    }
  };

  const today = new Date();

  const isRecurringScheduledToday = (task: Task): boolean => {
    if (!task.recurrence) {
      return true;
    }
    return isTaskScheduledForDate(task, today);
  };

  const isActiveTask = (task: Task): boolean => {
    if (task.recurrence) {
      return isRecurringScheduledToday(task) && isTaskDue(task);
    }
    return !task.completed;
  };

  const isCompletedTask = (task: Task): boolean => {
    if (task.recurrence) {
      return isRecurringScheduledToday(task) && !isTaskDue(task);
    }
    return task.completed;
  };

  const getFilteredTasks = () => {
    let filtered = tasks;

    switch (filter) {
      case "active":
        filtered = tasks.filter(isActiveTask);
        break;
      case "completed":
        filtered = tasks.filter(isCompletedTask);
        break;
      case "recurring":
        filtered = tasks.filter((task) => !!task.recurrence);
        break;
      case "one-time":
        filtered = tasks.filter((task) => !task.recurrence);
        break;
      default:
        filtered = tasks;
    }

    return filtered;
  };

  const getPriorityColor = (priority: Task["priority"]) => {
    switch (priority) {
      case "high":
        return "bg-destructive/30 text-destructive border-destructive/50";
      case "medium":
        return "bg-chart-4/30 text-chart-4 border-chart-4/50";
      case "low":
        return "bg-chart-2/30 text-chart-2 border-chart-2/50";
    }
  };

  const getRecurrenceColor = (recurrence: Task["recurrence"]) => {
    switch (recurrence) {
      case "daily":
        return "bg-chart-1/30 text-chart-1 border-chart-1/50";
      case "weekly":
        return "bg-chart-2/30 text-chart-2 border-chart-2/50";
      case "monthly":
        return "bg-chart-4/30 text-chart-4 border-chart-4/50";
      default:
        return "";
    }
  };

  const activeTasks = tasks.filter(isActiveTask).length;

  const completedTasks = tasks.filter(isCompletedTask).length;

  const recurringTasks = tasks.filter((task) => !!task.recurrence).length;
  const oneTimeTasks = tasks.filter((task) => !task.recurrence).length;

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Tasks & Chores
            </h1>
            <p className="text-muted-foreground">
              {tasks.length > 0
                ? `${activeTasks} active, ${completedTasks} completed`
                : "Manage household tasks and assign them to family members"}
            </p>
          </div>
          <Link
            to="/tasks/new"
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Add Task
          </Link>
        </div>

        <div className="mb-4 flex gap-2 flex-wrap">
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-accent border border-border"
            }`}
          >
            All ({tasks.length})
          </button>
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "active"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-accent border border-border"
            }`}
          >
            Active ({activeTasks})
          </button>
          <button
            onClick={() => setFilter("completed")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "completed"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-accent border border-border"
            }`}
          >
            Completed ({completedTasks})
          </button>
          <button
            onClick={() => setFilter("recurring")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "recurring"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-accent border border-border"
            }`}
          >
            Recurring ({recurringTasks})
          </button>
          <button
            onClick={() => setFilter("one-time")}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === "one-time"
                ? "bg-primary text-primary-foreground"
                : "bg-card text-foreground hover:bg-accent border border-border"
            }`}
          >
            One-time ({oneTimeTasks})
          </button>
        </div>

        {getFilteredTasks().length === 0 ? (
          <div className="bg-card rounded-lg shadow-sm p-12 border border-border text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">
              {filter === "completed"
                ? "No completed tasks yet"
                : filter === "active"
                  ? "No active tasks"
                  : filter === "recurring"
                    ? "No recurring tasks"
                    : filter === "one-time"
                      ? "No one-time tasks"
                      : "No tasks yet"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {filter === "all"
                ? "Start adding tasks to keep your household organized"
                : filter === "active"
                  ? "All tasks are completed! Great job!"
                  : "Complete some tasks to see them here"}
            </p>
            {filter !== "all" && (
              <button
                onClick={() => setFilter("all")}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                View All Tasks
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {getFilteredTasks().map((task) => {
              const isScheduledToday = isRecurringScheduledToday(task);
              const isDue = task.recurrence
                ? isScheduledToday && isTaskDue(task)
                : !task.completed;
              const isCompleted = task.recurrence
                ? isScheduledToday && !isTaskDue(task)
                : task.completed;
              const periodCompletions = task.recurrence
                ? getCompletionsThisPeriod(task)
                : [];
              const resolvedAssignee = getTaskAssigneeForDate(task, today);

              return (
                <div
                  key={task.id}
                  className={`bg-card rounded-lg shadow-sm border p-6 transition-colors ${
                    isCompleted ? "bg-secondary border-border" : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="flex-shrink-0 mt-1"
                      disabled={task.recurrence ? !isScheduledToday : false}
                      aria-label={
                        task.recurrence && !isScheduledToday
                          ? "Not scheduled today"
                          : isDue
                            ? "Mark as complete"
                            : "Mark as incomplete"
                      }
                    >
                      {isDue ? (
                        <Circle size={24} className="text-muted-foreground" />
                      ) : (
                        <CheckCircle2 size={24} className="text-primary" />
                      )}
                    </button>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h3
                              className={`text-lg font-semibold ${
                                isCompleted
                                  ? "text-muted-foreground line-through"
                                  : "text-foreground"
                              }`}
                            >
                              {task.title}
                            </h3>
                            {task.recurrence && (
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded border flex items-center gap-1 ${getRecurrenceColor(
                                  task.recurrence
                                )}`}
                              >
                                <Repeat size={12} />
                                {task.recurrence.charAt(0).toUpperCase() +
                                  task.recurrence.slice(1)}
                              </span>
                            )}
                            {task.recurrence && !isScheduledToday && (
                              <span className="px-2 py-1 text-xs font-medium rounded border bg-muted text-muted-foreground border-border">
                                Not scheduled today
                              </span>
                            )}
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-4">
                            {resolvedAssignee && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <User size={16} />
                                <span>
                                  {getMemberName(resolvedAssignee) ||
                                    resolvedAssignee}
                                </span>
                              </div>
                            )}
                            {!task.recurrence && task.dueDate && (
                              <div className="text-sm text-muted-foreground">
                                Due:{" "}
                                {new Date(task.dueDate).toLocaleDateString()}
                              </div>
                            )}
                            {task.recurrence &&
                              periodCompletions.length > 0 && (
                                <div className="text-sm text-primary font-medium">
                                  ✓ Done {periodCompletions.length} time
                                  {periodCompletions.length > 1
                                    ? "s"
                                    : ""} this{" "}
                                  {task.recurrence === "daily"
                                    ? "day"
                                    : task.recurrence === "weekly"
                                      ? "week"
                                      : "month"}
                                </div>
                              )}
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(
                                task.priority
                              )}`}
                            >
                              {task.priority.charAt(0).toUpperCase() +
                                task.priority.slice(1)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Link
                            to="/tasks/$taskId/edit"
                            params={{ taskId: task.id }}
                            className="p-2 hover:bg-accent rounded text-muted-foreground transition-colors"
                            aria-label="Edit task"
                          >
                            <Pencil size={18} />
                          </Link>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-2 hover:bg-destructive/20 rounded text-destructive transition-colors"
                            aria-label="Delete task"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
