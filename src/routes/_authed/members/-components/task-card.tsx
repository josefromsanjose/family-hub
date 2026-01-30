import { CheckCircle2, Circle } from "lucide-react";
import type { Task } from "@/contexts/TasksContext";

interface TaskCardProps {
  task: Task;
  onToggle: () => void;
}

export function TaskCard({ task, onToggle }: TaskCardProps) {
  const formattedDueDate = task.dueDate
    ? new Date(task.dueDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div
      className={`flex items-start gap-4 rounded-lg border-2 p-4 transition-all ${
        task.completed
          ? "border-primary bg-primary/10"
          : "border-border hover:border-primary"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex-shrink-0 mt-1"
        aria-label={task.completed ? "Mark as not done" : "Mark as done"}
      >
        {task.completed ? (
          <CheckCircle2
            size={28}
            className="text-primary"
            strokeWidth={2.5}
          />
        ) : (
          <Circle
            size={28}
            className="text-muted-foreground hover:text-primary transition-colors"
            strokeWidth={2.5}
          />
        )}
      </button>
      <div className="flex-1">
        <h3
          className={`text-lg font-semibold ${
            task.completed
              ? "text-muted-foreground line-through"
              : "text-foreground"
          }`}
        >
          {task.title}
        </h3>
        {task.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {task.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground">
            {task.priority}
          </span>
          <span className="text-xs text-muted-foreground">
            {formattedDueDate ? `Due ${formattedDueDate}` : "No due date"}
          </span>
        </div>
      </div>
    </div>
  );
}
