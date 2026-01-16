import { CalendarDays, Repeat, User, Users } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { TaskData, MemberList } from "./TaskWizard.types";

interface ConfirmStepProps {
  data: TaskData;
  recurrenceLabel: string;
  priorityLabel: string;
  PriorityIcon: LucideIcon;
  members: MemberList;
}

export function ConfirmStep({
  data,
  recurrenceLabel,
  priorityLabel,
  PriorityIcon,
  members,
}: ConfirmStepProps) {
  const assignedMember = data.assignedTo
    ? members.find((m) => m.id === data.assignedTo)
    : null;
  const assignedToName = assignedMember?.name || "Anyone";
  const weekdayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekLabels = ["", "1st", "2nd", "3rd", "4th", "5th"];

  const scheduleSummary = (() => {
    if (data.recurrence === "once") return "No schedule";
    if (data.recurrence === "daily") return "Every day";
    if (data.recurrence === "weekly") {
      if (data.recurrenceDays.length === 0) return "Any day this week";
      return data.recurrenceDays
        .slice()
        .sort()
        .map((day) => weekdayLabels[day])
        .join(", ");
    }
    if (data.recurrence === "monthly") {
      if (data.monthlyPattern === "day_of_month" && data.recurrenceDayOfMonth) {
        return `Day ${data.recurrenceDayOfMonth} each month`;
      }
      if (
        data.monthlyPattern === "nth_weekday" &&
        data.recurrenceWeekday !== null &&
        data.recurrenceWeekOfMonth !== null
      ) {
        return `${weekLabels[data.recurrenceWeekOfMonth]} ${
          weekdayLabels[data.recurrenceWeekday]
        } each month`;
      }
      return "Monthly";
    }
    return "No schedule";
  })();

  const rotationSummary = (() => {
    if (data.rotationMode !== "odd_even_week") return null;
    const names = data.rotationAssignees
      .map((id) => members.find((m) => m.id === id)?.name)
      .filter(Boolean);
    if (names.length >= 2) {
      return `${names[0]} (odd weeks), ${names[1]} (even weeks)`;
    }
    return "Alternate by week";
  })();

  return (
    <div className="bg-muted/50 rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <CalendarDays className="w-5 h-5 text-muted-foreground" />
        <span className="font-medium">{data.title}</span>
      </div>
      <div className="flex items-center gap-3">
        <User className="w-5 h-5 text-muted-foreground" />
        <span>{assignedToName}</span>
      </div>
      <div className="flex items-center gap-3">
        <Repeat className="w-5 h-5 text-muted-foreground" />
        <span>{recurrenceLabel}</span>
      </div>
      <div className="flex items-center gap-3">
        <CalendarDays className="w-5 h-5 text-muted-foreground" />
        <span>{scheduleSummary}</span>
      </div>
      {rotationSummary && (
        <div className="flex items-center gap-3">
          <Users className="w-5 h-5 text-muted-foreground" />
          <span>{rotationSummary}</span>
        </div>
      )}
      <div className="flex items-center gap-3">
        <PriorityIcon className="w-5 h-5 text-muted-foreground" />
        <span>{priorityLabel} priority</span>
      </div>
      <div className="flex items-center gap-3">
        <CalendarDays className="w-5 h-5 text-muted-foreground" />
        <span>
          {data.dueDate ? data.dueDate.toLocaleDateString() : "No due date"}
        </span>
      </div>
    </div>
  );
}
