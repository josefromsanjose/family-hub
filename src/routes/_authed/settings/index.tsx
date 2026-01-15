import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit2,
  Users,
  Loader2,
  User,
  Languages,
} from "lucide-react";
import {
  getHouseholdMembers,
  deleteHouseholdMember,
  type HouseholdMemberResponse,
} from "@/server/household";
import type { HouseholdRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { m } from "@paraglide/messages";
import { LanguageSection } from "@/routes/_authed/settings/-components/LanguageSection";

export const Route = createFileRoute("/_authed/settings/")({
  loader: async () => {
    return {
      members: await getHouseholdMembers(),
    };
  },
  pendingComponent: SettingsPending,
  component: Settings,
});

function getRoleLabel(role: HouseholdRole) {
  switch (role) {
    case "admin":
      return m.role_admin();
    case "adult":
      return m.role_adult();
    case "child":
    default:
      return m.role_child();
  }
}

function Settings() {
  const queryClient = useQueryClient();
  const { userId } = useRouteContext({ from: "__root__" });
  const { members: initialMembers } = Route.useLoaderData();

  // Fetch members with TanStack Query
  const { data: members = initialMembers, error } = useQuery({
    queryKey: ["household-members"],
    queryFn: () => getHouseholdMembers(),
    initialData: initialMembers,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHouseholdMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
    },
  });

  const handleDelete = (member: HouseholdMemberResponse) => {
    if (member.clerkUserId) {
      alert(m.member_delete_owner_error());
      return;
    }
    if (confirm(m.member_delete_confirm())) {
      deleteMutation.mutate({ data: { id: member.id } });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
            <p className="text-destructive">{m.error_loading_members()}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            {m.settings_title()}
          </h1>
          <p className="text-muted-foreground">{m.settings_subtitle()}</p>
        </div>

        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-muted-foreground" size={24} />
          <h2 className="text-xl font-bold text-foreground">
            {m.household_members_heading()}
          </h2>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Add Member Card - always first */}
          <AddMemberCard />

          {/* Member Cards */}
          {members.map((member) => (
            <MemberCard
              key={member.id}
              member={member}
              onDelete={() => handleDelete(member)}
              isDeleting={deleteMutation.isPending}
            />
          ))}
        </div>
        {/* Language Section */}
        <LanguageSection members={members} userId={userId} />
      </div>
    </div>
  );
}

function SettingsPending() {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="flex items-center gap-3 mb-3">
          <Languages className="text-muted-foreground" size={24} />
          <h2 className="text-xl font-bold text-foreground">
            {m.language_heading()}
          </h2>
        </div>
        <Skeleton className="h-4 w-56 mb-6" />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Skeleton className="h-20 w-full rounded-xl" />
          <Skeleton className="h-20 w-full rounded-xl" />
        </div>

        <div className="flex items-center gap-3 mb-6">
          <Users className="text-muted-foreground" size={24} />
          <h2 className="text-xl font-bold text-foreground">
            {m.household_members_heading()}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <MemberCardSkeleton />
          <MemberCardSkeleton />
          <MemberCardSkeleton />
        </div>
      </div>
    </div>
  );
}

// Add Member Card Component
function AddMemberCard() {
  return (
    <Link to="/settings/members/new">
      <Card className="border-2 border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-accent/50 transition-colors cursor-pointer h-full">
        <CardContent className="flex flex-col items-center justify-center pt-6 h-full min-h-[200px]">
          {/* Plus icon in avatar style */}
          <div className="relative mb-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-muted">
                <Plus className="w-10 h-10 text-muted-foreground" />
              </AvatarFallback>
            </Avatar>
          </div>

          {/* Label */}
          <h3 className="font-semibold text-muted-foreground text-lg mb-1">
            {m.add_member_title()}
          </h3>
          <p className="text-sm text-muted-foreground">
            {m.add_member_subtitle()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

function MemberCardSkeleton() {
  return (
    <Card className="border border-border/60">
      <CardContent className="flex flex-col items-center pt-6">
        <div className="relative mb-4">
          <Skeleton className="h-20 w-20 rounded-full" />
        </div>
        <Skeleton className="h-5 w-28 mb-2" />
        <Skeleton className="h-4 w-16" />
      </CardContent>
      <CardFooter className="gap-2">
        <Skeleton className="h-9 w-full rounded-md" />
        <Skeleton className="h-9 w-9 rounded-md" />
      </CardFooter>
    </Card>
  );
}

// Member Card Component
interface MemberCardProps {
  member: HouseholdMemberResponse;
  onDelete: () => void;
  isDeleting: boolean;
}

function MemberCard({ member, onDelete, isDeleting }: MemberCardProps) {
  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardContent className="flex flex-col items-center pt-6">
        {/* Large avatar with person icon */}
        <div className="relative mb-4">
          <Avatar className="w-20 h-20">
            <AvatarFallback className={member.color || "bg-muted"}>
              <User className="w-10 h-10 text-white/80" />
            </AvatarFallback>
          </Avatar>
          {member.clerkUserId && (
            <span className="absolute -bottom-1 -right-1 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
              {m.member_you()}
            </span>
          )}
        </div>

        {/* Member info */}
        <h3 className="font-semibold text-foreground text-lg mb-1">
          {member.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {getRoleLabel(member.role)}
        </p>
      </CardContent>

      <CardFooter className="gap-2">
        <Button variant="outline" className="flex-1" size="sm" asChild>
          <Link
            to="/settings/members/$memberId/edit"
            params={{ memberId: member.id }}
          >
            <Edit2 size={16} />
            {m.member_edit()}
          </Link>
        </Button>
        {!member.clerkUserId && (
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onDelete}
            disabled={isDeleting}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            {isDeleting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Trash2 size={16} />
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
