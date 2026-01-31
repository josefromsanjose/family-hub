import { v } from "convex/values";
import { internalMutation, internalQuery } from "./_generated/server";
import {
  getMemberByClerkUserId,
  getMemberByIdInHousehold,
  requireClerkUserId,
  requireHouseholdId,
} from "./lib/household";
import { generateId } from "./lib/ids";

const DEFAULT_MEMBER_LOCALE = "en";
const DEFAULT_NEW_MEMBER_ROLE = "child";
const DEFAULT_OWNER_RELATION = "parent";
const DEFAULT_OWNER_ROLE = "admin";
const DEFAULT_HOUSEHOLD_NAME = "My Household";

const MEMBER_COLORS = [
  "bg-pink-500",
  "bg-blue-500",
  "bg-green-500",
  "bg-yellow-500",
  "bg-purple-500",
  "bg-orange-500",
  "bg-red-500",
  "bg-indigo-500",
];

const householdRole = v.union(
  v.literal("admin"),
  v.literal("adult"),
  v.literal("child")
);
const householdRelation = v.union(
  v.literal("parent"),
  v.literal("child"),
  v.literal("grandparent"),
  v.literal("sibling"),
  v.literal("aunt_uncle"),
  v.literal("cousin"),
  v.literal("guardian"),
  v.literal("partner"),
  v.literal("roommate"),
  v.literal("other")
);
const memberLocale = v.union(v.literal("en"), v.literal("es"));

export const ensureHouseholdForClerkUser = internalMutation({
  args: {
    memberName: v.string(),
  },
  handler: async (ctx, args) => {
    const clerkUserId = await requireClerkUserId(ctx);
    const existingMember = await getMemberByClerkUserId(
      ctx,
      clerkUserId
    );
    if (existingMember) {
      return {
        householdId: existingMember.householdId,
        memberId: existingMember.id,
        created: false,
      };
    }

    const now = Date.now();
    const householdId = generateId();
    const memberId = generateId();

    const householdDocId = await ctx.db.insert("households", {
      id: householdId,
      ownerId: null,
      name: DEFAULT_HOUSEHOLD_NAME,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("householdMembers", {
      id: memberId,
      householdId,
      clerkUserId,
      name: args.memberName,
      locale: DEFAULT_MEMBER_LOCALE,
      role: DEFAULT_OWNER_ROLE,
      relation: DEFAULT_OWNER_RELATION,
      relationLabel: null,
      color: MEMBER_COLORS[0],
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.patch(householdDocId, {
      ownerId: memberId,
      updatedAt: now,
    });

    return { householdId, memberId, created: true };
  },
});

export const getHouseholdIdForClerkUser = internalQuery({
  args: {},
  handler: async (ctx) => {
    const householdId = await requireHouseholdId(ctx);
    return { householdId };
  },
});

export const getHouseholdMembers = internalQuery({
  args: {},
  handler: async (ctx) => {
    const householdId = await requireHouseholdId(ctx);
    const members = await ctx.db
      .query("householdMembers")
      .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
      .collect();

    members.sort((a, b) => a.createdAt - b.createdAt);
    return members;
  },
});

export const getHouseholdMemberById = internalQuery({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx);
    return getMemberByIdInHousehold(ctx, householdId, args.id);
  },
});

export const createHouseholdMember = internalMutation({
  args: {
    name: v.string(),
    role: v.optional(householdRole),
    locale: v.optional(memberLocale),
    relation: v.optional(householdRelation),
    relationLabel: v.optional(v.union(v.null(), v.string())),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx);
    const now = Date.now();

    const memberCount = await ctx.db
      .query("householdMembers")
      .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
      .collect();

    const color =
      args.color ??
      MEMBER_COLORS[memberCount.length % MEMBER_COLORS.length] ??
      MEMBER_COLORS[0];

    const member = {
      id: generateId(),
      householdId,
      clerkUserId: null,
      name: args.name.trim(),
      role: args.role ?? DEFAULT_NEW_MEMBER_ROLE,
      locale: args.locale ?? DEFAULT_MEMBER_LOCALE,
      relation: args.relation ?? null,
      relationLabel: args.relationLabel?.trim() || null,
      color,
      createdAt: now,
      updatedAt: now,
    };

    await ctx.db.insert("householdMembers", member);
    return member;
  },
});

export const updateHouseholdMember = internalMutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    role: v.optional(householdRole),
    locale: v.optional(memberLocale),
    relation: v.optional(v.union(v.null(), householdRelation)),
    relationLabel: v.optional(v.union(v.null(), v.string())),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx);
    const existingMember = await getMemberByIdInHousehold(
      ctx,
      householdId,
      args.id
    );

    if (!existingMember) {
      throw new Error("Member not found or not authorized");
    }

    const updatedAt = Date.now();
    await ctx.db.patch(existingMember._id, {
      ...(args.name !== undefined && { name: args.name.trim() }),
      ...(args.role !== undefined && { role: args.role }),
      ...(args.locale !== undefined && { locale: args.locale }),
      ...(args.relation !== undefined && { relation: args.relation }),
      ...(args.relationLabel !== undefined && {
        relationLabel: args.relationLabel?.trim() || null,
      }),
      ...(args.color !== undefined && { color: args.color }),
      updatedAt,
    });

    return {
      ...existingMember,
      ...(args.name !== undefined && { name: args.name.trim() }),
      ...(args.role !== undefined && { role: args.role }),
      ...(args.locale !== undefined && { locale: args.locale }),
      ...(args.relation !== undefined && { relation: args.relation }),
      ...(args.relationLabel !== undefined && {
        relationLabel: args.relationLabel?.trim() || null,
      }),
      ...(args.color !== undefined && { color: args.color }),
      updatedAt,
    };
  },
});

export const deleteHouseholdMember = internalMutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx);
    const existingMember = await getMemberByIdInHousehold(
      ctx,
      householdId,
      args.id
    );

    if (!existingMember) {
      throw new Error("Member not found or not authorized");
    }

    if (existingMember.clerkUserId) {
      throw new Error("Cannot delete the household owner");
    }

    await ctx.db.delete(existingMember._id);
    return { success: true };
  },
});
