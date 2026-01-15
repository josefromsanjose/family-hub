import { createFileRoute, Link, useRouteContext } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Trash2,
  Edit2,
  Save,
  X,
  Users,
  Loader2,
  User,
  Languages,
} from "lucide-react";
import {
  getHouseholdMembers,
  updateHouseholdMember,
  deleteHouseholdMember,
  type HouseholdMemberResponse,
} from "@/server/household";
import type { HouseholdRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
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

  // Mutations
  const updateMutation = useMutation({
    mutationFn: updateHouseholdMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      setEditingId(null);
      setEditData(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteHouseholdMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
    },
  });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<{
    id: string;
    name: string;
    role: HouseholdRole;
    color: string | null;
  } | null>(null);

  const startEdit = (member: HouseholdMemberResponse) => {
    setEditingId(member.id);
    setEditData({
      id: member.id,
      name: member.name,
      role: member.role,
      color: member.color,
    });
  };

  const saveEdit = () => {
    if (!editData || !editData.name.trim()) return;
    updateMutation.mutate({
      data: {
        id: editData.id,
        name: editData.name.trim(),
        role: editData.role,
      },
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

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
              isEditing={editingId === member.id}
              editData={editData}
              onStartEdit={() => startEdit(member)}
              onSaveEdit={saveEdit}
              onCancelEdit={cancelEdit}
              onDelete={() => handleDelete(member)}
              onEditDataChange={setEditData}
              isUpdating={updateMutation.isPending}
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
  isEditing: boolean;
  editData: {
    id: string;
    name: string;
    role: HouseholdRole;
    color: string | null;
  } | null;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: () => void;
  onEditDataChange: (
    data: {
      id: string;
      name: string;
      role: HouseholdRole;
      color: string | null;
    } | null
  ) => void;
  isUpdating: boolean;
  isDeleting: boolean;
}

function MemberCard({
  member,
  isEditing,
  editData,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  onEditDataChange,
  isUpdating,
  isDeleting,
}: MemberCardProps) {
  if (isEditing) {
    return (
      <Card className="border-2 border-primary">
        <CardContent className="flex flex-col items-center pt-6">
          {/* Avatar */}
          <Avatar className="w-20 h-20 mb-4">
            <AvatarFallback className={member.color || "bg-muted"}>
              <User className="w-10 h-10 text-white/80" />
            </AvatarFallback>
          </Avatar>

          {/* Edit form */}
          <div className="w-full space-y-3">
            <Input
              value={editData?.name || ""}
              onChange={(e) =>
                onEditDataChange({
                  ...editData!,
                  name: e.target.value,
                })
              }
              placeholder={m.member_name_placeholder()}
              className="text-center"
            />
            <select
              value={editData?.role || "child"}
              onChange={(e) =>
                onEditDataChange({
                  ...editData!,
                  role: e.target.value as HouseholdRole,
                })
              }
              className="w-full h-9 px-3 rounded-md border border-input bg-background text-foreground text-sm"
              disabled={member.clerkUserId !== null}
            >
              <option value="admin">{m.role_admin()}</option>
              <option value="adult">{m.role_adult()}</option>
              <option value="child">{m.role_child()}</option>
            </select>
          </div>
        </CardContent>

        <CardFooter className="gap-2">
          <Button onClick={onSaveEdit} disabled={isUpdating} className="flex-1">
            {isUpdating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            {m.member_save()}
          </Button>
          <Button variant="outline" size="icon" onClick={onCancelEdit}>
            <X size={18} />
          </Button>
        </CardFooter>
      </Card>
    );
  }

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
        <Button
          variant="outline"
          onClick={onStartEdit}
          className="flex-1"
          size="sm"
        >
          <Edit2 size={16} />
          {m.member_edit()}
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
