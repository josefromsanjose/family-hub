import type { HouseholdRole } from "@prisma/client";
import { SelectionCard } from "@/components/touch/SelectionCard";
import { ROLE_OPTIONS } from "@/data/household";
import type { MemberFormData } from "@/routes/_authed/settings/-components/member-form";

type RoleOption = {
  id: HouseholdRole;
  label: string;
  description: string;
};

const DEFAULT_ROLE_OPTIONS = ROLE_OPTIONS as RoleOption[];

interface MemberRoleSectionProps {
  data: MemberFormData;
  onChange: (next: Partial<MemberFormData>) => void;
  options?: RoleOption[];
  disabled?: boolean;
}

export function MemberRoleSection({
  data,
  onChange,
  options = DEFAULT_ROLE_OPTIONS,
  disabled = false,
}: MemberRoleSectionProps) {
  return (
    <div className="space-y-3">
      {options.map((option) => (
        <SelectionCard
          key={option.id}
          label={option.label}
          description={option.description}
          selected={data.role === option.id}
          onSelect={() => onChange({ role: option.id })}
          disabled={disabled}
        />
      ))}
    </div>
  );
}
