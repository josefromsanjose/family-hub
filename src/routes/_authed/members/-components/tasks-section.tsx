import type { Task } from "@/contexts/TasksContext";
import { TaskCard } from "./task-card";
import { EmptyState } from "./empty-state";

interface TasksSectionProps {
  tasks: Task[];
  onToggleTask: (task: Task) => void;
}

export function TasksSection({ tasks, onToggleTask }: TasksSectionProps) {
  return (
    <section className="bg-card rounded-lg shadow-sm border border-border p-6">
      <h2 className="text-xl font-bold text-card-foreground mb-4">My Tasks</h2>

      {tasks.length === 0 ? (
        <EmptyState message="No one-time tasks assigned yet." />
      ) : (
        <div className="space-y-3">
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onToggle={() => onToggleTask(task)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
