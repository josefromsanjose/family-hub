import { CalendarDays, CheckCircle2, ListChecks } from "lucide-react";
import { StatCard } from "./stat-card";

interface StatsGridProps {
  choresDueCount: number;
  openTasksCount: number;
  todayEventsCount: number;
}

export function StatsGrid({
  choresDueCount,
  openTasksCount,
  todayEventsCount,
}: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      <StatCard
        label="Chores Due"
        value={choresDueCount.toString()}
        icon={ListChecks}
      />
      <StatCard
        label="Tasks Open"
        value={openTasksCount.toString()}
        icon={CheckCircle2}
      />
      <StatCard
        label="Events Today"
        value={todayEventsCount.toString()}
        icon={CalendarDays}
      />
    </div>
  );
}
