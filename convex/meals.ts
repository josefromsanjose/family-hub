import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, internalQuery } from "./_generated/server";
import { requireHouseholdId } from "./lib/household";
import { generateId } from "./lib/ids";

const mealType = v.union(
  v.literal("breakfast"),
  v.literal("lunch"),
  v.literal("dinner")
);

type DbCtx = QueryCtx | MutationCtx;

async function getMealByIdInHousehold(
  ctx: DbCtx,
  householdId: string,
  mealId: string
) {
  return ctx.db
    .query("meals")
    .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
    .filter((q) => q.eq(q.field("id"), mealId))
    .unique();
}

async function getMealLibraryItemById(
  ctx: DbCtx,
  householdId: string,
  itemId: string
) {
  return ctx.db
    .query("mealLibraryItems")
    .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
    .filter((q) => q.eq(q.field("id"), itemId))
    .unique();
}

export const getMeals = internalQuery({
  args: {
    clerkUserId: v.string(),
    startDate: v.optional(v.string()),
    endDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx, args.clerkUserId);
    const startDate = args.startDate ? new Date(args.startDate).valueOf() : null;
    const endDate = args.endDate ? new Date(args.endDate).valueOf() : null;

    const meals = await ctx.db
      .query("meals")
      .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
      .collect();

    const filteredMeals = meals.filter((meal) => {
      if (startDate !== null && meal.date < startDate) return false;
      if (endDate !== null && meal.date > endDate) return false;
      return true;
    });

    filteredMeals.sort((a, b) => {
      if (a.date !== b.date) return a.date - b.date;
      if (a.mealType !== b.mealType) return a.mealType.localeCompare(b.mealType);
      return a.createdAt - b.createdAt;
    });

    return filteredMeals;
  },
});

export const getMealById = internalQuery({
  args: { clerkUserId: v.string(), id: v.string() },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx, args.clerkUserId);
    return getMealByIdInHousehold(ctx, householdId, args.id);
  },
});

export const getMealLibraryItems = internalQuery({
  args: { clerkUserId: v.string(), query: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx, args.clerkUserId);
    const items = await ctx.db
      .query("mealLibraryItems")
      .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
      .collect();

    const normalizedQuery = args.query?.trim().toLowerCase();
    const filteredItems = normalizedQuery
      ? items.filter((item) =>
          item.name.toLowerCase().includes(normalizedQuery)
        )
      : items;

    filteredItems.sort((a, b) => {
      if (a.updatedAt !== b.updatedAt) return b.updatedAt - a.updatedAt;
      return a.name.localeCompare(b.name);
    });

    return filteredItems;
  },
});

export const createMeal = internalMutation({
  args: {
    clerkUserId: v.string(),
    name: v.optional(v.string()),
    date: v.string(),
    mealType,
    notes: v.optional(v.string()),
    mealLibraryItemId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx, args.clerkUserId);
    const now = Date.now();
    let name = args.name?.trim() ?? "";
    let notes = args.notes?.trim() || null;

    if (args.mealLibraryItemId) {
      const libraryItem = await getMealLibraryItemById(
        ctx,
        householdId,
        args.mealLibraryItemId
      );
      if (!libraryItem) {
        throw new Error("Meal library item not found or not authorized");
      }
      name = libraryItem.name.trim();
      notes = libraryItem.notes?.trim() || null;
    }

    const meal = {
      id: generateId(),
      householdId,
      name,
      date: new Date(args.date).valueOf(),
      mealType: args.mealType,
      notes,
      mealLibraryItemId: args.mealLibraryItemId ?? null,
      createdAt: now,
      updatedAt: now,
    };

    await ctx.db.insert("meals", meal);
    return meal;
  },
});

export const createMealLibraryItem = internalMutation({
  args: {
    clerkUserId: v.string(),
    name: v.string(),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx, args.clerkUserId);
    const now = Date.now();

    const item = {
      id: generateId(),
      householdId,
      name: args.name.trim(),
      notes: args.notes?.trim() || null,
      createdAt: now,
      updatedAt: now,
    };

    await ctx.db.insert("mealLibraryItems", item);
    return item;
  },
});

export const updateMeal = internalMutation({
  args: {
    clerkUserId: v.string(),
    id: v.string(),
    name: v.optional(v.string()),
    date: v.optional(v.string()),
    mealType: v.optional(mealType),
    notes: v.optional(v.union(v.null(), v.string())),
  },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx, args.clerkUserId);
    const existingMeal = await getMealByIdInHousehold(
      ctx,
      householdId,
      args.id
    );

    if (!existingMeal) {
      throw new Error("Meal not found or not authorized");
    }

    const patch = {
      ...(args.name !== undefined && { name: args.name.trim() }),
      ...(args.date !== undefined && {
        date: new Date(args.date).valueOf(),
      }),
      ...(args.mealType !== undefined && { mealType: args.mealType }),
      ...(args.notes !== undefined && {
        notes: args.notes?.trim() || null,
      }),
      updatedAt: Date.now(),
    };

    await ctx.db.patch(existingMeal._id, patch);
    return { ...existingMeal, ...patch };
  },
});

export const deleteMeal = internalMutation({
  args: { clerkUserId: v.string(), id: v.string() },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx, args.clerkUserId);
    const existingMeal = await getMealByIdInHousehold(
      ctx,
      householdId,
      args.id
    );

    if (!existingMeal) {
      throw new Error("Meal not found or not authorized");
    }

    await ctx.db.delete(existingMeal._id);
    return { success: true };
  },
});
