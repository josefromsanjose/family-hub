import { Users } from "lucide-react";
import { AvatarCard } from "@/components/touch/AvatarCard";
import { SelectionCard } from "@/components/touch/SelectionCard";
import type { MemberList, TaskData } from "./TaskWizard.types";

interface RotationStepProps {
  data: TaskData;
  onChange: (next: Partial<TaskData>) => void;
  members: MemberList;
}

export function RotationStep({ data, onChange, members }: RotationStepProps) {
  if (data.recurrence !== "weekly") {
    return (
      <div className="bg-muted/50 rounded-xl p-4 text-sm text-muted-foreground">
        Rotation applies to weekly chores only.
      </div>
    );
  }

  const handleToggleAssignee = (memberId: string) => {
    const exists = data.rotationAssignees.includes(memberId);
    if (exists) {
      onChange({
        rotationAssignees: data.rotationAssignees.filter(
          (id) => id !== memberId
        ),
      });
      return;
    }
    if (data.rotationAssignees.length >= 2) {
      return;
    }
    onChange({
      rotationAssignees: [...data.rotationAssignees, memberId],
      rotationAnchorDate: data.rotationAnchorDate ?? new Date(),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <SelectionCard
          label="No rotation"
          description="Keep the same assignee"
          icon={<Users className="h-5 w-5" />}
          selected={data.rotationMode === "none"}
          onSelect={() =>
            onChange({
              rotationMode: "none",
              rotationAssignees: [],
              rotationAnchorDate: null,
            })
          }
        />
        <SelectionCard
          label="Alternate weekly"
          description="Odd/even weeks"
          icon={<Users className="h-5 w-5" />}
          selected={data.rotationMode === "odd_even_week"}
          onSelect={() =>
            onChange({
              rotationMode: "odd_even_week",
              rotationAnchorDate: data.rotationAnchorDate ?? new Date(),
            })
          }
        />
      </div>

      {data.rotationMode === "odd_even_week" && (
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">
            Pick two members to alternate weekly.
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {members.map((member) => (
              <AvatarCard
                key={member.id}
                name={member.name}
                color={member.color || "bg-muted"}
                selected={data.rotationAssignees.includes(member.id)}
                onSelect={() => handleToggleAssignee(member.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
