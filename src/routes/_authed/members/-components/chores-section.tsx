import { Link } from "@tanstack/react-router";
import { Trophy } from "lucide-react";
import type { Task } from "@/contexts/TasksContext";
import { ChoreCard } from "./chore-card";
import { EmptyState } from "./empty-state";

interface ChoresSectionProps {
  memberId: string;
  memberName: string;
  chores: Task[];
  isTaskDue: (task: Task) => boolean;
  getCompletionStreak: (task: Task) => number;
  onToggleChore: (task: Task) => void;
}

export function ChoresSection({
  memberId,
  memberName,
  chores,
  isTaskDue,
  getCompletionStreak,
  onToggleChore,
}: ChoresSectionProps) {
  const allChoresDone = chores.length > 0 && chores.every((chore) => !isTaskDue(chore));

  return (
    <section className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-card-foreground">
          Today's Chores
        </h2>
        <Link
          to="/members/$memberId/chores"
          params={{ memberId }}
          className="text-sm text-primary hover:text-primary/80 font-medium"
        >
          See all chores →
        </Link>
      </div>

      {chores.length === 0 ? (
        <EmptyState message="No chores assigned yet." />
      ) : (
        <div className="space-y-3">
          {chores.map((chore) => {
            const isDue = isTaskDue(chore);
            const streak = getCompletionStreak(chore);
            const showRotationInfo =
              chore.rotationMode === "odd_even_week" &&
              chore.rotationAssignees.length >= 2;

            return (
              <ChoreCard
                key={chore.id}
                chore={chore}
                isDue={isDue}
                streak={streak}
                memberName={memberName}
                showRotationInfo={showRotationInfo}
                onToggle={() => onToggleChore(chore)}
              />
            );
          })}
        </div>
      )}

      {allChoresDone && (
        <div className="mt-4 bg-primary rounded-lg shadow-lg p-5 text-center">
          <Trophy className="mx-auto h-12 w-12 text-primary-foreground mb-2" />
          <p className="text-lg font-bold text-primary-foreground">
            Awesome job, {memberName}!
          </p>
          <p className="text-sm text-primary-foreground/80">
            All chores are done for today.
          </p>
        </div>
      )}
    </section>
  );
}
