import { CalendarDays, Repeat, User } from "lucide-react";
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
