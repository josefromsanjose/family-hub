import { useMemo } from "react";
import { useMember } from "@/hooks/use-member";
import { useTasks } from "@/contexts/TasksContext";
import { useCalendar } from "@/contexts/CalendarContext";

export function useMemberData(memberId: string) {
  const { member, isLoading: isMemberLoading } = useMember(memberId);
  const {
    tasks,
    completeTask,
    uncompleteTask,
    isTaskDue,
    getCompletionStreak,
    getTaskAssigneeForDate,
    isTaskScheduledForDate,
  } = useTasks();
  const { events } = useCalendar();

  const today = useMemo(() => new Date(), []);

  const memberChores = useMemo(
    () =>
      tasks.filter((task) => {
        if (!task.recurrence) return false;
        if (!isTaskScheduledForDate(task, today)) return false;
        const assignee = getTaskAssigneeForDate(task, today);
        return assignee === memberId;
      }),
    [tasks, memberId, getTaskAssigneeForDate, isTaskScheduledForDate, today]
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
    const todayKey = new Date().toISOString().split("T")[0];
    return events.filter((event) => {
      const eventDate = event.date.split("T")[0];
      if (eventDate !== todayKey) return false;
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

  return {
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
  };
}
