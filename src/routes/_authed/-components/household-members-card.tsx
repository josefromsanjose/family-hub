import { Settings, Users } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useHousehold } from "@/contexts/HouseholdContext";

interface HouseholdMember {
  id: string;
  name: string;
  role?: string | null;
  color?: string | null;
}

export function HouseholdMembersCard() {
  const { members = [], isLoading } = useHousehold();

  return (
    <div className="bg-card rounded-lg shadow-sm p-6 border border-border h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-card-foreground">
          Household Members
        </h2>
        <Link
          to="/settings"
          className="p-2 hover:bg-accent rounded-lg transition-colors text-muted-foreground"
          aria-label="Manage members"
        >
          <Settings size={18} />
        </Link>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto pr-1">
        {isLoading ? (
          <MembersLoadingState />
        ) : members.length === 0 ? (
          <EmptyMembersState />
        ) : (
          <div className="space-y-3">
            {members.map((member) => (
              <HouseholdMemberItem key={member.id} member={member} />
            ))}
            <Link
              to="/settings"
              className="block mt-4 text-center text-sm text-primary hover:text-primary/80 font-medium"
            >
              Manage Members →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function MembersLoadingState() {
  const rows = Array.from({ length: 3 });

  return (
    <div className="space-y-3" aria-live="polite">
      {rows.map((_, index) => (
        <div
          key={`member-skeleton-${index}`}
          className="flex items-center gap-3 rounded-lg p-2"
        >
          <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 min-w-0">
            <div className="h-3 w-32 rounded bg-muted animate-pulse mb-2" />
            <div className="h-2.5 w-20 rounded bg-muted animate-pulse" />
          </div>
        </div>
      ))}
      <span className="sr-only">Loading members...</span>
    </div>
  );
}

function EmptyMembersState() {
  return (
    <div className="text-center py-4">
      <Users className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
      <p className="text-sm text-muted-foreground mb-3">No members added yet</p>
      <Link
        to="/settings"
        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
      >
        Add Members
      </Link>
    </div>
  );
}

function HouseholdMemberItem({ member }: { member: HouseholdMember }) {
  const initial = member.name.charAt(0).toUpperCase();
  const colorClass = member.color || "bg-muted";

  return (
    <Link
      to="/members/$memberId"
      params={{ memberId: member.id }}
      className="flex items-center gap-3 rounded-lg p-2 hover:bg-accent transition-colors"
    >
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0 ${colorClass}`}
      >
        {initial}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-card-foreground truncate">{member.name}</p>
        {member.role ? (
          <p className="text-xs text-muted-foreground truncate">{member.role}</p>
        ) : null}
      </div>
    </Link>
  );
}
