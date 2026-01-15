import { createServerFn } from "@tanstack/react-start";
import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { Prisma, HouseholdRelation, HouseholdRole } from "@prisma/client";
import { prisma } from "@/db";
import {
  DEFAULT_NEW_MEMBER_ROLE,
  DEFAULT_OWNER_RELATION,
  DEFAULT_OWNER_ROLE,
} from "@/data/household";

type EnsureHouseholdResult = {
  householdId: string;
  memberId: string;
  created: boolean;
};

const DEFAULT_HOUSEHOLD_NAME = "My Household";

export const ensureHouseholdForCurrentUser = createServerFn({
  method: "POST",
}).handler(async (): Promise<EnsureHouseholdResult> => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.householdMember.findUnique({
        where: { clerkUserId: userId },
      });

      if (existing) {
        return {
          householdId: existing.householdId,
          memberId: existing.id,
          created: false,
        };
      }

      // Fetch user info from Clerk for personalized name
      const user = await clerkClient().users.getUser(userId);
      const memberName =
        user.firstName ||
        user.username ||
        user.emailAddresses[0]?.emailAddress?.split("@")[0] ||
        "Owner";

      // Create member with nested household creation (2 ops instead of 3)
      const member = await tx.householdMember.create({
        data: {
          clerkUserId: userId,
          name: memberName,
          role: DEFAULT_OWNER_ROLE,
          relation: DEFAULT_OWNER_RELATION,
          household: {
            create: {
              name: DEFAULT_HOUSEHOLD_NAME,
            },
          },
        },
      });

      // Set the owner reference on the household
      await tx.household.update({
        where: { id: member.householdId },
        data: { ownerId: member.id },
      });

      return {
        householdId: member.householdId,
        memberId: member.id,
        created: true,
      };
    });
  } catch (error) {
    // Handle race condition: unique constraint violation on clerkUserId
    // This can happen if two requests try to create the same user simultaneously
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const existing = await prisma.householdMember.findUnique({
        where: { clerkUserId: userId },
      });

      if (existing) {
        return {
          householdId: existing.householdId,
          memberId: existing.id,
          created: false,
        };
      }
    }

    // Re-throw all other errors (connection issues, schema errors, etc.)
    throw error;
  }
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
  relation: HouseholdRelation | null;
  relationLabel: string | null;
  color: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Helper to get current user's household ID
async function getCurrentUserHouseholdId(): Promise<string> {
  const { userId } = await auth();

  if (!userId) {
    throw new Error("Unauthorized");
  }

  const member = await prisma.householdMember.findUnique({
    where: { clerkUserId: userId },
    select: { householdId: true },
  });

  if (!member) {
    throw new Error("No household found for user");
  }

  return member.householdId;
}

// GET: Fetch all members for the current user's household
export const getHouseholdMembers = createServerFn({ method: "GET" }).handler(
  async (): Promise<HouseholdMemberResponse[]> => {
    const householdId = await getCurrentUserHouseholdId();

    const members = await prisma.householdMember.findMany({
      where: { householdId },
      orderBy: { createdAt: "asc" },
    });

    return members;
  }
);

// Type for creating a new member
export type CreateMemberInput = {
  name: string;
  role?: HouseholdRole;
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
    const householdId = await getCurrentUserHouseholdId();

    // Generate a color if not provided
    const colors = [
      "bg-pink-500",
      "bg-blue-500",
      "bg-green-500",
      "bg-yellow-500",
      "bg-purple-500",
      "bg-orange-500",
      "bg-red-500",
      "bg-indigo-500",
    ];

    // Get current member count to pick a color
    const memberCount = await prisma.householdMember.count({
      where: { householdId },
    });

    const member = await prisma.householdMember.create({
      data: {
        householdId,
        name: data.name.trim(),
        role: data.role || DEFAULT_NEW_MEMBER_ROLE,
        relation: data.relation,
        relationLabel: data.relationLabel?.trim() || null,
        color: data.color || colors[memberCount % colors.length],
      },
    });

    return member;
  });

// Type for updating a member
export type UpdateMemberInput = {
  id: string;
  name?: string;
  role?: HouseholdRole;
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
    const householdId = await getCurrentUserHouseholdId();

    // Verify the member belongs to the current user's household
    const existingMember = await prisma.householdMember.findFirst({
      where: {
        id: data.id,
        householdId,
      },
    });

    if (!existingMember) {
      throw new Error("Member not found or not authorized");
    }

    const member = await prisma.householdMember.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.role !== undefined && { role: data.role }),
        ...(data.relation !== undefined && { relation: data.relation }),
        ...(data.relationLabel !== undefined && {
          relationLabel: data.relationLabel?.trim() || null,
        }),
        ...(data.color !== undefined && { color: data.color }),
      },
    });

    return member;
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
    const householdId = await getCurrentUserHouseholdId();

    // Verify the member belongs to the current user's household
    const existingMember = await prisma.householdMember.findFirst({
      where: {
        id: data.id,
        householdId,
      },
    });

    if (!existingMember) {
      throw new Error("Member not found or not authorized");
    }

    // Prevent deleting the owner
    if (existingMember.clerkUserId) {
      throw new Error("Cannot delete the household owner");
    }

    await prisma.householdMember.delete({
      where: { id: data.id },
    });

    return { success: true };
  });
