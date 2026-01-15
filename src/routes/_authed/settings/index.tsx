import { createFileRoute, Link } from "@tanstack/react-router";
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

export const Route = createFileRoute("/_authed/settings/")({
  component: Settings,
});

// Map role enum to display labels
const roleLabels: Record<HouseholdRole, string> = {
  admin: "Admin",
  adult: "Adult",
  child: "Child",
};

function Settings() {
  const queryClient = useQueryClient();

  // Fetch members with TanStack Query
  const {
    data: members = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["household-members"],
    queryFn: () => getHouseholdMembers(),
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
      alert("Cannot delete the household owner");
      return;
    }
    if (confirm("Are you sure you want to remove this household member?")) {
      deleteMutation.mutate({ data: { id: member.id } });
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6 text-center">
            <p className="text-destructive">
              Error loading household members. Please try again.
            </p>
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
          <p className="text-muted-foreground">
            Manage your household members and preferences
          </p>
        </div>

        {/* Section header */}
        <div className="flex items-center gap-3 mb-6">
          <Users className="text-muted-foreground" size={24} />
          <h2 className="text-xl font-bold text-foreground">
            Household Members
          </h2>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="text-center py-12">
            <Loader2 className="mx-auto h-12 w-12 text-muted-foreground mb-4 animate-spin" />
            <p className="text-muted-foreground">Loading members...</p>
          </div>
        ) : (
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
        )}
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
            Add Member
          </h3>
          <p className="text-sm text-muted-foreground">
            Add a new family member
          </p>
        </CardContent>
      </Card>
    </Link>
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
              placeholder="Name"
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
              <option value="admin">Admin</option>
              <option value="adult">Adult</option>
              <option value="child">Child</option>
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
            Save
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
              You
            </span>
          )}
        </div>

        {/* Member info */}
        <h3 className="font-semibold text-foreground text-lg mb-1">
          {member.name}
        </h3>
        <p className="text-sm text-muted-foreground">
          {roleLabels[member.role]}
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
          Edit
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
