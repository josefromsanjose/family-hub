import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, CheckCircle2, Circle, User, Repeat } from "lucide-react";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useTasks, Task } from "@/contexts/TasksContext";

export const Route = createFileRoute("/_authed/tasks")({
  component: TasksAndChores,
});

function TasksAndChores() {
  const { members } = useHousehold();
  const {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
    uncompleteTask,
    isTaskDue,
    getCompletionsThisPeriod,
  } = useTasks();
  const [showAddForm, setShowAddForm] = useState(false);
  const [filter, setFilter] = useState<
    "all" | "active" | "completed" | "recurring" | "one-time"
  >("all");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedTo: "",
    dueDate: "",
    priority: "medium" as Task["priority"],
    recurrence: "" as "" | "daily" | "weekly" | "monthly",
  });

  const handleAddTask = () => {
    if (!formData.title.trim()) return;

    addTask({
      title: formData.title,
      description: formData.description || undefined,
      assignedTo: formData.assignedTo || undefined,
      dueDate: formData.dueDate || undefined,
      priority: formData.priority,
      recurrence: formData.recurrence || undefined,
    });

    setFormData({
      title: "",
      description: "",
      assignedTo: "",
      dueDate: "",
      priority: "medium",
      recurrence: "",
    });
    setShowAddForm(false);
  };

  const handleToggleTask = (task: Task) => {
    if (task.recurrence) {
      // For recurring tasks, check if it's due
      if (isTaskDue(task)) {
        completeTask(task.id, task.assignedTo || "Unknown");
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

  const getFilteredTasks = () => {
    let filtered = tasks;

    switch (filter) {
      case "active":
        filtered = tasks.filter((task) => {
          if (task.recurrence) {
            return isTaskDue(task);
          }
          return !task.completed;
        });
        break;
      case "completed":
        filtered = tasks.filter((task) => {
          if (task.recurrence) {
            return !isTaskDue(task);
          }
          return task.completed;
        });
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

  const activeTasks = tasks.filter((task) => {
    if (task.recurrence) {
      return isTaskDue(task);
    }
    return !task.completed;
  }).length;

  const completedTasks = tasks.filter((task) => {
    if (task.recurrence) {
      return !isTaskDue(task);
    }
    return task.completed;
  }).length;

  const recurringTasks = tasks.filter((task) => !!task.recurrence).length;
  const oneTimeTasks = tasks.filter((task) => !task.recurrence).length;

  return (
    <div className="min-h-screen bg-background p-6">
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
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus size={20} />
            Add Task
          </button>
        </div>

        {showAddForm && (
          <div className="bg-card rounded-lg shadow-sm p-6 mb-6 border border-border">
            <h2 className="text-xl font-bold text-card-foreground mb-4">
              Add New Task
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Task Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  placeholder="e.g., Take out trash, Vacuum living room"
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  placeholder="Additional details..."
                  rows={3}
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Assign To
                </label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) =>
                    setFormData({ ...formData, assignedTo: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">Unassigned</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.name}>
                      {member.name} {member.role ? `(${member.role})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Due Date
                </label>
                <input
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) =>
                    setFormData({ ...formData, dueDate: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  disabled={!!formData.recurrence}
                />
                {formData.recurrence && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Due date disabled for recurring tasks
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priority: e.target.value as Task["priority"],
                    })
                  }
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Recurrence (optional)
                </label>
                <select
                  value={formData.recurrence}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurrence: e.target.value as
                        | ""
                        | "daily"
                        | "weekly"
                        | "monthly",
                    })
                  }
                  className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                >
                  <option value="">None (One-time task)</option>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handleAddTask}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
              >
                Add Task
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-accent transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

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
              const isDue = task.recurrence ? isTaskDue(task) : !task.completed;
              const periodCompletions = task.recurrence
                ? getCompletionsThisPeriod(task)
                : [];

              return (
                <div
                  key={task.id}
                  className={`bg-card rounded-lg shadow-sm border p-6 transition-colors ${
                    !isDue ? "bg-secondary border-border" : "border-border"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className="flex-shrink-0 mt-1"
                      aria-label={
                        isDue ? "Mark as complete" : "Mark as incomplete"
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
                                !isDue
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
                          </div>
                          {task.description && (
                            <p className="text-sm text-muted-foreground mb-3">
                              {task.description}
                            </p>
                          )}
                          <div className="flex flex-wrap items-center gap-4">
                            {task.assignedTo && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <User size={16} />
                                <span>{task.assignedTo}</span>
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
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="p-2 hover:bg-destructive/20 rounded text-destructive transition-colors flex-shrink-0"
                          aria-label="Delete task"
                        >
                          <Trash2 size={18} />
                        </button>
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
