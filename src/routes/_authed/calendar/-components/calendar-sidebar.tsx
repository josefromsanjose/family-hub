import { Check, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useHousehold } from "@/contexts/HouseholdContext";

type CalendarSidebarProps = {
  selectedMemberId: string | null;
  onMemberSelect: (memberId: string | null) => void;
  onAddEvent: () => void;
};

function CalendarSidebar({
  selectedMemberId,
  onMemberSelect,
  onAddEvent,
}: CalendarSidebarProps) {
  const { members } = useHousehold();

  return (
    <Card className="h-fit">
      <CardHeader>
        <Button onClick={onAddEvent}>
          <Plus size={20} />
          Add Event
        </Button>
        <CardTitle>Members</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <button
          type="button"
          onClick={() => onMemberSelect(null)}
          aria-label="Select All"
          aria-pressed={selectedMemberId === null}
          className={cn(
            "relative flex w-full items-center justify-between gap-3 rounded-xl border-2 px-2 py-2",
            "transition-all duration-150 active:scale-[0.98]",
            "active:border-primary/70 active:bg-primary/10",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
            selectedMemberId === null
              ? "border-primary bg-primary/5"
              : "border-border hover:border-primary/50"
          )}
        >
          <span className="text-sm font-medium">All Members</span>
          {selectedMemberId === null ? (
            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <Check className="h-3 w-3" />
            </span>
          ) : null}
        </button>
        {members.map((member) => (
          <button
            key={member.id}
            type="button"
            onClick={() => onMemberSelect(member.id)}
            aria-label={`Select ${member.name}`}
            aria-pressed={selectedMemberId === member.id}
            className={cn(
              "relative flex w-full items-center justify-between gap-3 rounded-xl border-2 px-2 py-2",
              "transition-all duration-150 active:scale-[0.98]",
              "active:border-primary/70 active:bg-primary/10",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
              selectedMemberId === member.id
                ? "border-primary bg-primary/5"
                : "border-border hover:border-primary/50"
            )}
          >
            <span className="text-sm font-medium">{member.name}</span>
            {selectedMemberId === member.id ? (
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
                <Check className="h-3 w-3" />
              </span>
            ) : null}
          </button>
        ))}
      </CardContent>
    </Card>
  );
}

export { CalendarSidebar };
