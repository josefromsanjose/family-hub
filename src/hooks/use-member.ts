import { useQuery } from "@tanstack/react-query";
import { getHouseholdMemberById } from "@/server/household";
import type { HouseholdMember } from "@/contexts/HouseholdContext";

/**
 * Fetches a single household member by ID.
 * Uses TanStack Query for caching and deduplication.
 */
export function useMember(memberId: string) {
  const {
    data: member,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["household-member", memberId],
    queryFn: async () => {
      const response = await getHouseholdMemberById({ data: { id: memberId } });
      if (!response) return null;

      // Map to HouseholdMember interface
      const mapped: HouseholdMember = {
        id: response.id,
        name: response.name,
        role: response.role,
        locale: response.locale,
        relation: response.relation,
        relationLabel: response.relationLabel,
        color: response.color,
        clerkUserId: response.clerkUserId,
      };

      return mapped;
    },
    enabled: !!memberId,
  });

  return {
    member: member ?? null,
    isLoading,
    error: error as Error | null,
  };
}
