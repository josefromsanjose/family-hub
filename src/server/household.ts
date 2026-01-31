import { createServerFn } from "@tanstack/react-start";
import type {
  HouseholdRelation,
  HouseholdRole,
  MemberLocale,
} from "@prisma/client";
import { DEFAULT_NEW_MEMBER_ROLE } from "@/data/household";
import { getConvexClient } from "@/server/convex";
import { getClerkUserId } from "@/server/clerk";
import { internal } from "../../convex/_generated/api";

type EnsureHouseholdResult = {
  householdId: string;
  memberId: string;
  created: boolean;
};

type HouseholdMemberRecord = {
  id: string;
  householdId: string;
  clerkUserId: string | null;
  name: string;
  role: HouseholdRole;
  locale: MemberLocale;
  relation: HouseholdRelation | null;
  relationLabel: string | null;
  color: string | null;
  createdAt: number;
  updatedAt: number;
};

function toHouseholdMemberResponse(
  member: HouseholdMemberRecord
): HouseholdMemberResponse {
  return {
    id: member.id,
    householdId: member.householdId,
    clerkUserId: member.clerkUserId,
    name: member.name,
    role: member.role,
    locale: member.locale,
    relation: member.relation,
    relationLabel: member.relationLabel,
    color: member.color,
    createdAt: new Date(member.createdAt),
    updatedAt: new Date(member.updatedAt),
  };
}

export const ensureHouseholdForCurrentUser = createServerFn({
  method: "POST",
}).handler(async (): Promise<EnsureHouseholdResult> => {
  const { clerkClient } =
    await import("@clerk/tanstack-react-start/server");
  const userId = await getClerkUserId();

  // Fetch user info from Clerk for personalized name
  const user = await clerkClient().users.getUser(userId);
  const memberName =
    user.firstName ||
    user.username ||
    user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
    "Owner";

  const convex = getConvexClient();
  return convex.mutation(internal.households.ensureHouseholdForClerkUser, {
    clerkUserId: userId,
    memberName,
  });
});

// ============================================================================
// Household Members CRUD Operations
// ============================================================================

// Type for household member returned from API
export type HouseholdMemberResponse = {
  id: string;
  householdId: string;
  clerkUserId: string | null;
  name: string;
  role: HouseholdRole;
  locale: MemberLocale;
  relation: HouseholdRelation | null;
  relationLabel: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Helper to get current user's household ID
export async function getCurrentUserHouseholdId(): Promise<string> {
  const userId = await getClerkUserId();
  const convex = getConvexClient();
  const result = await convex.query(
    internal.households.getHouseholdIdForClerkUser,
    {
      clerkUserId: userId,
    }
  );
  return result.householdId;
}

// GET: Fetch all members for the current user's household
export const getHouseholdMembers = createServerFn({ method: "GET" }).handler(
  async (): Promise<HouseholdMemberResponse[]> => {
    const userId = await getClerkUserId();
    const convex = getConvexClient();
    const members = await convex.query(
      internal.households.getHouseholdMembers,
      {
        clerkUserId: userId,
      }
    );

    return members.map(toHouseholdMemberResponse);
  }
);

// Type for fetching a single member
export type GetMemberByIdInput = {
  id: string;
};

// GET: Fetch a single member by ID (scoped to current user's household)
export const getHouseholdMemberById = createServerFn({ method: "GET" })
  .inputValidator((input: GetMemberByIdInput) => {
    if (!input.id) {
      throw new Error("Member ID is required");
    }
    return input;
  })
  .handler(async ({ data }): Promise<HouseholdMemberResponse | null> => {
    const userId = await getClerkUserId();
    const convex = getConvexClient();
    const member = await convex.query(
      internal.households.getHouseholdMemberById,
      {
        clerkUserId: userId,
        id: data.id,
      }
    );

    return member ? toHouseholdMemberResponse(member) : null;
  });

// Type for creating a new member
export type CreateMemberInput = {
  name: string;
  role?: HouseholdRole;
  locale?: MemberLocale;
  relation?: HouseholdRelation;
  relationLabel?: string;
  color?: string;
};

// POST: Create a new household member
export const createHouseholdMember = createServerFn({ method: "POST" })
  .inputValidator((input: CreateMemberInput) => {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error("Name is required");
    }
    return input;
  })
  .handler(async ({ data }): Promise<HouseholdMemberResponse> => {
    const userId = await getClerkUserId();
    const convex = getConvexClient();
    const member = await convex.mutation(
      internal.households.createHouseholdMember,
      {
        clerkUserId: userId,
        name: data.name.trim(),
        role: data.role || DEFAULT_NEW_MEMBER_ROLE,
        ...(data.locale !== undefined && { locale: data.locale }),
        ...(data.relation !== undefined && { relation: data.relation }),
        ...(data.relationLabel !== undefined && {
          relationLabel: data.relationLabel?.trim() || null,
        }),
        ...(data.color !== undefined && { color: data.color }),
      }
    );

    return toHouseholdMemberResponse(member);
  });

// Type for updating a member
export type UpdateMemberInput = {
  id: string;
  name?: string;
  role?: HouseholdRole;
  locale?: MemberLocale;
  relation?: HouseholdRelation | null;
  relationLabel?: string | null;
  color?: string;
};

// POST: Update an existing household member
export const updateHouseholdMember = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateMemberInput) => {
    if (!input.id) {
      throw new Error("Member ID is required");
    }
    return input;
  })
  .handler(async ({ data }): Promise<HouseholdMemberResponse> => {
    const userId = await getClerkUserId();
    const convex = getConvexClient();
    const member = await convex.mutation(
      internal.households.updateHouseholdMember,
      {
        clerkUserId: userId,
        id: data.id,
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.locale !== undefined && { locale: data.locale }),
        ...(data.relation !== undefined && { relation: data.relation }),
        ...(data.relationLabel !== undefined && {
          relationLabel: data.relationLabel?.trim() || null,
        }),
        ...(data.color !== undefined && { color: data.color }),
      }
    );

    return toHouseholdMemberResponse(member);
  });

// Type for deleting a member
export type DeleteMemberInput = {
  id: string;
};

// POST: Delete a household member
export const deleteHouseholdMember = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteMemberInput) => {
    if (!input.id) {
      throw new Error("Member ID is required");
    }
    return input;
  })
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const userId = await getClerkUserId();
    const convex = getConvexClient();
    return convex.mutation(internal.households.deleteHouseholdMember, {
      clerkUserId: userId,
      id: data.id,
    });
  });
