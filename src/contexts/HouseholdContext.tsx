import { createContext, useContext, ReactNode, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { HouseholdRelation, HouseholdRole } from "@prisma/client";
import {
  getHouseholdMembers,
  createHouseholdMember,
  updateHouseholdMember,
  deleteHouseholdMember,
  type HouseholdMemberResponse,
} from "@/server/household";

// Re-export the type from server for convenience
export type { HouseholdMemberResponse };
export type { HouseholdRelation, HouseholdRole };

// Simplified member interface for backward compatibility
export interface HouseholdMember {
  id: string;
  name: string;
  role: HouseholdRole;
  locale: HouseholdMemberResponse["locale"];
  relation: HouseholdRelation | null;
  relationLabel: string | null;
  color: string | null;
  clerkUserId?: string | null;
}

interface HouseholdContextType {
  members: HouseholdMember[];
  isLoading: boolean;
  error: Error | null;
  addMember: (member: {
    name: string;
    role?: HouseholdRole;
    locale?: HouseholdMemberResponse["locale"];
    relation?: HouseholdRelation;
    relationLabel?: string;
    color?: string;
  }) => void;
  updateMember: (id: string, member: Partial<HouseholdMember>) => void;
  deleteMember: (id: string) => void;
  getMemberById: (id: string) => HouseholdMember | undefined;
}

const HouseholdContext = createContext<HouseholdContextType | undefined>(
  undefined
);

// Map server response to HouseholdMember
function mapToMember(response: HouseholdMemberResponse): HouseholdMember {
  return {
    id: response.id,
    name: response.name,
    role: response.role,
    locale: response.locale,
    relation: response.relation,
    relationLabel: response.relationLabel,
    color: response.color,
    clerkUserId: response.clerkUserId,
  };
}

export function HouseholdProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  // Fetch members with TanStack Query
  const {
    data: membersData = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["household-members"],
    queryFn: () => getHouseholdMembers(),
  });

  // Map server response to member format
  const members = membersData.map(mapToMember);

  // Create mutation
  const createMutation = useMutation({
    mutationFn: createHouseholdMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
    },
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: updateHouseholdMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: deleteHouseholdMember,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
    },
  });

  const addMember = useCallback(
    (member: {
      name: string;
      role?: HouseholdRole;
      locale?: HouseholdMemberResponse["locale"];
      relation?: HouseholdRelation;
      relationLabel?: string;
      color?: string;
    }) => {
      createMutation.mutate({
        data: {
          name: member.name,
          role: member.role || "child",
          locale: member.locale,
          relation: member.relation,
          relationLabel: member.relationLabel,
          color: member.color,
        },
      });
    },
    [createMutation]
  );

  const updateMember = useCallback(
    (id: string, updates: Partial<HouseholdMember>) => {
      updateMutation.mutate({
        data: {
          id,
          name: updates.name,
          role: updates.role,
          locale: updates.locale,
          relation: updates.relation,
          relationLabel: updates.relationLabel,
          color: updates.color || undefined,
        },
      });
    },
    [updateMutation]
  );

  const deleteMember = useCallback(
    (id: string) => {
      deleteMutation.mutate({ data: { id } });
    },
    [deleteMutation]
  );

  const getMemberById = useCallback(
    (id: string) => {
      return members.find((m) => m.id === id);
    },
    [members]
  );

  return (
    <HouseholdContext.Provider
      value={{
        members,
        isLoading,
        error: error as Error | null,
        addMember,
        updateMember,
        deleteMember,
        getMemberById,
      }}
    >
      {children}
    </HouseholdContext.Provider>
  );
}

export function useHousehold() {
  const context = useContext(HouseholdContext);
  if (context === undefined) {
    throw new Error("useHousehold must be used within a HouseholdProvider");
  }
  return context;
}
