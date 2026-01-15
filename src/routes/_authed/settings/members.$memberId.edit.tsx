import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Save } from "lucide-react";
import type { HouseholdRole } from "@prisma/client";
import { getHouseholdMembers, updateHouseholdMember } from "@/server/household";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { m } from "@paraglide/messages";
import { MemberNameSection } from "@/routes/_authed/settings/-components/MemberNameSection";
import { MemberRoleSection } from "@/routes/_authed/settings/-components/MemberRoleSection";
import { MemberRelationSection } from "@/routes/_authed/settings/-components/MemberRelationSection";
import {
  isMemberNameValid,
  isMemberRelationValid,
  type MemberFormData,
} from "@/routes/_authed/settings/-components/member-form";

const EDIT_ROLE_OPTIONS: {
  id: HouseholdRole;
  label: string;
  description: string;
}[] = [
  {
    id: "admin",
    label: "Admin",
    description: "Can manage tasks and household items",
  },
  {
    id: "adult",
    label: "Adult",
    description: "Can manage tasks and household items",
  },
  { id: "child", label: "Child", description: "Can view and complete tasks" },
];

export const Route = createFileRoute(
  "/_authed/settings/members/$memberId/edit"
)({
  loader: async () => {
    return {
      members: await getHouseholdMembers(),
    };
  },
  component: MemberEditPage,
});

function MemberEditPage() {
  const { memberId } = Route.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { members: initialMembers } = Route.useLoaderData();

  const { data: members = initialMembers, error } = useQuery({
    queryKey: ["household-members"],
    queryFn: () => getHouseholdMembers(),
    initialData: initialMembers,
  });

  const member = useMemo(
    () => members.find((candidate) => candidate.id === memberId),
    [members, memberId]
  );

  const [data, setData] = useState<MemberFormData>({
    name: "",
    role: "child",
    relation: null,
    relationLabel: "",
  });

  useEffect(() => {
    if (!member) return;
    setData({
      name: member.name,
      role: member.role,
      relation: member.relation,
      relationLabel: member.relationLabel ?? "",
    });
  }, [member]);

  const canSave = useMemo(
    () => isMemberNameValid(data) && isMemberRelationValid(data),
    [data]
  );

  const updateMutation = useMutation({
    mutationFn: updateHouseholdMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      navigate({ to: "/settings" });
    },
  });

  const handleSave = () => {
    if (!member || !canSave) return;
    updateMutation.mutate({
      data: {
        id: member.id,
        name: data.name.trim(),
        role: data.role,
        relation: data.relation ?? null,
        relationLabel: data.relationLabel.trim() || null,
      },
    });
  };

  if (error) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border border-destructive bg-destructive/10 p-6 text-center">
            <p className="text-destructive">{m.error_loading_members()}</p>
          </Card>
        </div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card className="p-6 text-center">
            <h1 className="text-xl font-semibold text-foreground">
              Member not found
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              The member you are looking for is no longer available.
            </p>
          </Card>
          <Button asChild variant="outline" className="w-full">
            <Link to="/settings">Back to settings</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link to="/settings" aria-label="Back to settings">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Edit member</h1>
            <p className="text-sm text-muted-foreground">
              Update their profile details and household role.
            </p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Name</h2>
          <MemberNameSection
            data={data}
            onChange={(next) =>
              setData((prev) => ({
                ...prev,
                ...next,
              }))
            }
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Role</h2>
          <MemberRoleSection
            data={data}
            onChange={(next) =>
              setData((prev) => ({
                ...prev,
                ...next,
              }))
            }
            options={EDIT_ROLE_OPTIONS}
            disabled={member.clerkUserId !== null}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            Relationship
          </h2>
          <MemberRelationSection
            data={data}
            onChange={(next) =>
              setData((prev) => ({
                ...prev,
                ...next,
              }))
            }
          />
        </section>

        <div className="space-y-3">
          <Button
            onClick={handleSave}
            disabled={!canSave || updateMutation.isPending}
            className="w-full h-12"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save changes
              </>
            )}
          </Button>
          <Button asChild variant="ghost" className="w-full">
            <Link to="/settings">Cancel</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
