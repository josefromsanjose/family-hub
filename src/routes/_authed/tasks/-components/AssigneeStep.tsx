import { AvatarCard } from "@/components/touch/AvatarCard";
import type { MemberList, TaskData } from "./TaskWizard.types";

interface AssigneeStepProps {
  data: TaskData;
  onChange: (next: Partial<TaskData>) => void;
  members: MemberList;
}

export function AssigneeStep({ data, onChange, members }: AssigneeStepProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <AvatarCard
        name="Anyone"
        color="bg-muted"
        selected={data.assignedTo === null}
        onSelect={() => onChange({ assignedTo: null })}
      />
      {members.map((member) => (
        <AvatarCard
          key={member.id}
          name={member.name}
          color={member.color || "bg-muted"}
          selected={data.assignedTo === member.name}
          onSelect={() => onChange({ assignedTo: member.name })}
        />
      ))}
    </div>
  );
}
