import type { MutationCtx, QueryCtx } from "../_generated/server";

type DbCtx = QueryCtx | MutationCtx;

export async function getMemberByClerkUserId(
  ctx: DbCtx,
  clerkUserId: string
) {
  return ctx.db
    .query("householdMembers")
    .withIndex("by_clerkUserId", (q) => q.eq("clerkUserId", clerkUserId))
    .unique();
}

export async function requireHouseholdId(ctx: DbCtx, clerkUserId: string) {
  const member = await getMemberByClerkUserId(ctx, clerkUserId);
  if (!member) {
    throw new Error("No household found for user");
  }
  return member.householdId;
}

export async function requireMember(ctx: DbCtx, clerkUserId: string) {
  const member = await getMemberByClerkUserId(ctx, clerkUserId);
  if (!member) {
    throw new Error("No household member found for user");
  }
  return member;
}

export async function getMemberByIdInHousehold(
  ctx: DbCtx,
  householdId: string,
  memberId: string
) {
  return ctx.db
    .query("householdMembers")
    .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
    .filter((q) => q.eq(q.field("id"), memberId))
    .unique();
}
