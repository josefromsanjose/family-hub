import { createServerFn } from "@tanstack/react-start";
import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/db";

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
          role: "owner",
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
