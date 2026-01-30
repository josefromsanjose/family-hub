import { createFileRoute } from "@tanstack/react-router";
import { useCallback } from "react";
import type { Task } from "@/contexts/TasksContext";
import {
  MemberHeader,
  StatsGrid,
  ChoresSection,
  TasksSection,
  ScheduleSection,
  MemberNotFound,
  MemberPageSkeleton,
} from "./-components";
import { useMemberData } from "./-hooks/use-member-data";

export const Route = createFileRoute("/_authed/members/$memberId/")({
  component: MemberLandingPage,
});

function MemberLandingPage() {
  const { memberId } = Route.useParams();
  const {
    member,
    isMemberLoading,
    memberChores,
    memberTasks,
    choresDueToday,
    openTasks,
    todayEvents,
    bestStreak,
    completeTask,
    uncompleteTask,
    isTaskDue,
    getCompletionStreak,
  } = useMemberData(memberId);

  const handleToggleChore = useCallback(
    (task: Task) => {
      if (isTaskDue(task)) {
        completeTask(task.id, memberId);
      } else {
        uncompleteTask(task.id);
      }
    },
    [isTaskDue, completeTask, uncompleteTask, memberId]
  );

  const handleToggleTask = useCallback(
    (task: Task) => {
      if (task.completed) {
        uncompleteTask(task.id);
      } else {
        completeTask(task.id, memberId);
      }
    },
    [completeTask, uncompleteTask, memberId]
  );

  if (isMemberLoading) {
    return <MemberPageSkeleton />;
  }

  if (!member) {
    return <MemberNotFound />;
  }

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <MemberHeader
          name={member.name}
          role={member.role}
          relation={member.relation}
          color={member.color}
          bestStreak={bestStreak}
        />

        <StatsGrid
          choresDueCount={choresDueToday.length}
          openTasksCount={openTasks.length}
          todayEventsCount={todayEvents.length}
        />

        <ChoresSection
          memberId={memberId}
          memberName={member.name}
          chores={memberChores}
          isTaskDue={isTaskDue}
          getCompletionStreak={getCompletionStreak}
          onToggleChore={handleToggleChore}
        />

        <TasksSection tasks={memberTasks} onToggleTask={handleToggleTask} />

        <ScheduleSection events={todayEvents} />
      </div>
    </div>
  );
}
