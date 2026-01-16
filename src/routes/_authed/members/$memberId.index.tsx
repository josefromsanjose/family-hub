import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, type ComponentType } from "react";
import {
  CalendarDays,
  CheckCircle2,
  Circle,
  Flame,
  ListChecks,
  Trophy,
} from "lucide-react";
import { useHousehold } from "@/contexts/HouseholdContext";
import { useTasks, type Task } from "@/contexts/TasksContext";
import { useCalendar } from "@/contexts/CalendarContext";

export const Route = createFileRoute("/_authed/members/$memberId/")({
  component: MemberLandingPage,
});

function MemberLandingPage() {
  const { memberId } = Route.useParams();
  const { members } = useHousehold();
  const {
    tasks,
    completeTask,
    uncompleteTask,
    isTaskDue,
    getCompletionStreak,
  } = useTasks();
  const { events } = useCalendar();

  const member = useMemo(
    () => members.find((m) => m.id === memberId),
    [members, memberId]
  );

  const memberChores = useMemo(
    () =>
      tasks.filter((task) => task.recurrence && task.assignedTo === memberId),
    [tasks, memberId]
  );

  const memberTasks = useMemo(
    () =>
      tasks.filter((task) => !task.recurrence && task.assignedTo === memberId),
    [tasks, memberId]
  );

  const choresDueToday = useMemo(
    () => memberChores.filter((task) => isTaskDue(task)),
    [memberChores, isTaskDue]
  );

  const openTasks = useMemo(
    () => memberTasks.filter((task) => !task.completed),
    [memberTasks]
  );

  const todayEvents = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return events.filter((event) => {
      const eventDate = event.date.split("T")[0];
      if (eventDate !== today) return false;
      return event.participantId ? event.participantId === memberId : true;
    });
  }, [events, memberId]);

  const bestStreak = useMemo(() => {
    if (memberChores.length === 0) return 0;
    return Math.max(
      ...memberChores.map((task) => getCompletionStreak(task)),
      0
    );
  }, [memberChores, getCompletionStreak]);

  if (!member) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-card rounded-lg shadow-sm p-6 border border-border">
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Member not found
            </h1>
            <p className="text-muted-foreground mb-4">
              The member you are looking for does not exist.
            </p>
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              Back to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleToggleChore = (task: Task) => {
    if (isTaskDue(task)) {
      completeTask(task.id, memberId);
    } else {
      uncompleteTask(task.id);
    }
  };

  const handleToggleTask = (task: Task) => {
    if (task.completed) {
      uncompleteTask(task.id);
    } else {
      completeTask(task.id, memberId);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${member.color || "bg-muted"}`}
            >
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground">
                {member.name}
              </h1>
              <p className="text-sm text-muted-foreground">
                {member.role}
                {member.relation ? ` · ${member.relation}` : ""}
              </p>
            </div>
            {bestStreak > 0 && (
              <div className="flex items-center gap-2 text-primary font-semibold">
                <Flame className="h-5 w-5" />
                {bestStreak}-day streak
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard
            label="Chores Due"
            value={choresDueToday.length.toString()}
            icon={ListChecks}
          />
          <StatCard
            label="Tasks Open"
            value={openTasks.length.toString()}
            icon={CheckCircle2}
          />
          <StatCard
            label="Events Today"
            value={todayEvents.length.toString()}
            icon={CalendarDays}
          />
        </div>

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
          {memberChores.length === 0 ? (
            <EmptyState message="No chores assigned yet." />
          ) : (
            <div className="space-y-3">
              {memberChores.map((chore) => {
                const isDue = isTaskDue(chore);
                return (
                  <div
                    key={chore.id}
                    className={`flex items-start gap-4 rounded-lg border-2 p-4 transition-all ${
                      isDue
                        ? "border-border hover:border-primary"
                        : "border-primary bg-primary/10"
                    }`}
                  >
                    <button
                      onClick={() => handleToggleChore(chore)}
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
                          isDue
                            ? "text-foreground"
                            : "text-muted-foreground line-through"
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
                        {getCompletionStreak(chore) > 0 && (
                          <span className="flex items-center gap-1 text-xs text-primary font-medium">
                            <Flame className="h-3 w-3" />
                            {getCompletionStreak(chore)}-day streak
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {memberChores.length > 0 &&
            memberChores.every((chore) => !isTaskDue(chore)) && (
              <div className="mt-4 bg-primary rounded-lg shadow-lg p-5 text-center">
                <Trophy className="mx-auto h-12 w-12 text-primary-foreground mb-2" />
                <p className="text-lg font-bold text-primary-foreground">
                  Awesome job, {member.name}!
                </p>
                <p className="text-sm text-primary-foreground/80">
                  All chores are done for today.
                </p>
              </div>
            )}
        </section>

        <section className="bg-card rounded-lg shadow-sm border border-border p-6">
          <h2 className="text-xl font-bold text-card-foreground mb-4">
            My Tasks
          </h2>
          {memberTasks.length === 0 ? (
            <EmptyState message="No one-time tasks assigned yet." />
          ) : (
            <div className="space-y-3">
              {memberTasks.map((task) => (
                <div
                  key={task.id}
                  className={`flex items-start gap-4 rounded-lg border-2 p-4 transition-all ${
                    task.completed
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-primary"
                  }`}
                >
                  <button
                    onClick={() => handleToggleTask(task)}
                    className="flex-shrink-0 mt-1"
                    aria-label={
                      task.completed ? "Mark as not done" : "Mark as done"
                    }
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
                        {task.dueDate
                          ? `Due ${new Date(task.dueDate).toLocaleDateString(
                              "en-US",
                              {
                                month: "short",
                                day: "numeric",
                              }
                            )}`
                          : "No due date"}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="bg-card rounded-lg shadow-sm border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-card-foreground">
              Today's Schedule
            </h2>
            <Link
              to="/calendar"
              className="text-sm text-primary hover:text-primary/80 font-medium"
            >
              View calendar →
            </Link>
          </div>
          {todayEvents.length === 0 ? (
            <EmptyState message="No events scheduled for today." />
          ) : (
            <div className="space-y-3">
              {todayEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-1 text-xs font-semibold rounded-full bg-secondary text-secondary-foreground">
                        {event.type}
                      </span>
                      {event.time && (
                        <span className="text-xs text-muted-foreground">
                          {event.time}
                        </span>
                      )}
                    </div>
                    <h3 className="font-semibold text-foreground">
                      {event.title}
                    </h3>
                    {event.description && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {event.description}
                      </p>
                    )}
                    {!event.participantId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Family event
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="bg-card rounded-lg shadow-sm p-4 border border-border flex items-center gap-3">
      <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-2xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      {message}
    </div>
  );
}
