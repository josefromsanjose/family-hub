import { Flame } from "lucide-react";

interface MemberHeaderProps {
  name: string;
  role: string;
  relation?: string | null;
  color?: string | null;
  bestStreak: number;
}

export function MemberHeader({
  name,
  role,
  relation,
  color,
  bestStreak,
}: MemberHeaderProps) {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border p-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <div
          className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${color || "bg-muted"}`}
        >
          {name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">{name}</h1>
          <p className="text-sm text-muted-foreground">
            {role}
            {relation ? ` · ${relation}` : ""}
          </p>
        </div>
        {bestStreak > 0 && (
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Flame className="h-5 w-5" />
            {bestStreak}-day streak
          </div>
        )}
      </div>
    </div>
  );
}
