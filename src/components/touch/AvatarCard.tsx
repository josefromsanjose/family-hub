import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface AvatarCardProps {
  name: string;
  color: string;
  selected?: boolean;
  onSelect: () => void;
  ariaLabel?: string;
}

export function AvatarCard({
  name,
  color,
  selected = false,
  onSelect,
  ariaLabel,
}: AvatarCardProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-label={ariaLabel || `Select ${name}`}
      aria-pressed={selected}
      className={cn(
        "relative flex flex-col items-center gap-2 p-4 rounded-xl min-h-[100px]",
        "border-2 transition-all duration-150 active:scale-[0.98]",
        selected
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50"
      )}
    >
      <div
        className={cn(
          "w-14 h-14 rounded-full flex items-center justify-center",
          "text-white text-xl font-bold",
          color
        )}
      >
        {name.charAt(0).toUpperCase()}
      </div>
      <span className="text-sm font-medium">{name}</span>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
          <Check className="w-3 h-3" />
        </div>
      )}
    </button>
  );
}
