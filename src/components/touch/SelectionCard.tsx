import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectionCardProps {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  selected?: boolean;
  onSelect: () => void;
  disabled?: boolean;
}

export function SelectionCard({
  label,
  description,
  icon,
  selected = false,
  onSelect,
  disabled = false,
}: SelectionCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={disabled}
      className={cn(
        // Base styles - touch-optimized
        "w-full min-h-[80px] p-4 rounded-xl",
        "flex items-center gap-4 text-left text-foreground",
        "transition-all duration-150 active:scale-[0.98]",
        // Border and background
        "border-2",
        selected
          ? "border-primary bg-primary/5"
          : "border-border bg-background hover:border-primary/50",
        // Disabled state
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      {/* Icon */}
      {icon && (
        <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center text-muted-foreground">
          {icon}
        </div>
      )}

      {/* Label and description */}
      <div className="flex-1 min-w-0">
        <div className="text-lg font-semibold truncate">{label}</div>
        {description && (
          <div className="text-sm text-muted-foreground truncate">
            {description}
          </div>
        )}
      </div>

      {/* Selection indicator */}
      <div
        className={cn(
          "flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center",
          selected
            ? "border-primary bg-primary text-primary-foreground"
            : "border-muted-foreground/30"
        )}
      >
        {selected && <Check className="w-4 h-4" />}
      </div>
    </button>
  );
}
