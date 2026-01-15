import { Input } from "@/components/ui/input";
import { SelectionCard } from "@/components/touch/SelectionCard";
import { RELATION_OPTIONS } from "@/data/household";
import type { MemberFormData } from "@/routes/_authed/settings/-components/member-form";

interface MemberRelationSectionProps {
  data: MemberFormData;
  onChange: (next: Partial<MemberFormData>) => void;
  disabled?: boolean;
}

export function MemberRelationSection({
  data,
  onChange,
  disabled = false,
}: MemberRelationSectionProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {RELATION_OPTIONS.map((option) => (
          <SelectionCard
            key={option.id}
            label={option.label}
            description={option.description}
            selected={data.relation === option.id}
            onSelect={() =>
              onChange({
                relation: option.id,
                relationLabel:
                  option.id === "other" ? data.relationLabel : option.label,
              })
            }
            disabled={disabled}
          />
        ))}
      </div>
      {data.relation === "other" && (
        <Input
          type="text"
          placeholder="e.g., Godparent, Nanny, Family Friend"
          value={data.relationLabel}
          onChange={(e) => onChange({ relationLabel: e.target.value })}
          className="h-12 text-base px-4"
          autoComplete="off"
          disabled={disabled}
        />
      )}
    </div>
  );
}
