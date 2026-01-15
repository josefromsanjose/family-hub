import { Input } from "@/components/ui/input";
import type { MemberFormData } from "@/routes/_authed/settings/-components/member-form";

interface MemberNameSectionProps {
  data: MemberFormData;
  onChange: (next: Partial<MemberFormData>) => void;
  onEnter?: () => void;
  canProceed?: boolean;
  autoFocus?: boolean;
  helperText?: string;
}

export function MemberNameSection({
  data,
  onChange,
  onEnter,
  canProceed = true,
  autoFocus = false,
  helperText,
}: MemberNameSectionProps) {
  return (
    <div className="space-y-4">
      <Input
        data-wizard-input="name"
        type="text"
        placeholder="e.g., Emma, Dad, Grandma"
        value={data.name}
        autoFocus={autoFocus}
        onChange={(e) => onChange({ name: e.target.value })}
        onKeyDown={(e) => {
          if (e.key === "Enter" && onEnter && canProceed) {
            onEnter();
          }
        }}
        className="h-14 text-lg px-4"
        autoComplete="off"
      />
      {helperText && (
        <p className="text-sm text-muted-foreground text-center">
          {helperText}
        </p>
      )}
    </div>
  );
}
