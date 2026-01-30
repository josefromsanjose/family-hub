import { CheckCircle2, Circle, Flame } from "lucide-react";
import type { Task } from "@/contexts/TasksContext";

interface ChoreCardProps {
  chore: Task;
  isDue: boolean;
  streak: number;
  memberName: string;
  showRotationInfo: boolean;
  onToggle: () => void;
}

export function ChoreCard({
  chore,
  isDue,
  streak,
  memberName,
  showRotationInfo,
  onToggle,
}: ChoreCardProps) {
  return (
    <div
      className={`flex items-start gap-4 rounded-lg border-2 p-4 transition-all ${
        isDue
          ? "border-border hover:border-primary"
          : "border-primary bg-primary/10"
      }`}
    >
      <button
        onClick={onToggle}
        className="flex-shrink-0 mt-1"
        aria-label={isDue ? "Mark as done" : "Mark as not done"}
      >
        {isDue ? (
          <Circle
            size={28}
            className="text-muted-foreground hover:text-primary transition-colors"
            strokeWidth={2.5}
          />
        ) : (
          <CheckCircle2
            size={28}
            className="text-primary"
            strokeWidth={2.5}
          />
        )}
      </button>
      <div className="flex-1">
        <h3
          className={`text-lg font-semibold ${
            isDue ? "text-foreground" : "text-muted-foreground line-through"
          }`}
        >
          {chore.title}
        </h3>
        {chore.description && (
          <p className="text-sm text-muted-foreground mt-1">
            {chore.description}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-3 mt-2">
          {chore.recurrence && (
            <span className="px-2 py-1 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground">
              {chore.recurrence}
            </span>
          )}
          {showRotationInfo && (
            <span className="text-xs text-muted-foreground">
              Assigned this week: {memberName}
            </span>
          )}
          {streak > 0 && (
            <span className="flex items-center gap-1 text-xs text-primary font-medium">
              <Flame className="h-3 w-3" />
              {streak}-day streak
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
