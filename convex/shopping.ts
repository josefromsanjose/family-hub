import { v } from "convex/values";
import type { MutationCtx, QueryCtx } from "./_generated/server";
import { internalMutation, internalQuery } from "./_generated/server";
import { requireHouseholdId } from "./lib/household";
import { generateId } from "./lib/ids";

type DbCtx = QueryCtx | MutationCtx;

async function getShoppingItemById(
  ctx: DbCtx,
  householdId: string,
  itemId: string
) {
  return ctx.db
    .query("shoppingItems")
    .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
    .filter((q) => q.eq(q.field("id"), itemId))
    .unique();
}

const splitMealNotes = (notes: string | null): string[] => {
  if (!notes) return [];
  return notes
    .split(/[\n,;]+/g)
    .map((item) => item.trim().replace(/^[-*]\s+/, ""))
    .filter((item) => item.length > 0);
};

const dedupeItems = (items: string[]) => {
  const seen = new Set<string>();
  const unique: string[] = [];

  for (const item of items) {
    const normalized = item.toLowerCase();
    if (seen.has(normalized)) continue;
    seen.add(normalized);
    unique.push(item);
  }

  return unique;
};

export const getShoppingItems = internalQuery({
  args: {},
  handler: async (ctx) => {
    const householdId = await requireHouseholdId(ctx);
    const items = await ctx.db
      .query("shoppingItems")
      .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
      .collect();

    items.sort((a, b) => {
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }
      if (a.category !== b.category) {
        return a.category.localeCompare(b.category);
      }
      return b.createdAt - a.createdAt;
    });

    return items;
  },
});

export const createShoppingItem = internalMutation({
  args: {
    name: v.string(),
    quantity: v.optional(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx);
    const now = Date.now();
    const category = args.category?.trim() || "Other";
    const quantity = args.quantity?.trim() || null;

    const item = {
      id: generateId(),
      householdId,
      name: args.name.trim(),
      quantity,
      category,
      completed: false,
      listId: null,
      createdAt: now,
      updatedAt: now,
    };

    await ctx.db.insert("shoppingItems", item);
    return item;
  },
});

export const updateShoppingItem = internalMutation({
  args: {
    id: v.string(),
    name: v.optional(v.string()),
    quantity: v.optional(v.union(v.null(), v.string())),
    category: v.optional(v.string()),
    completed: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx);
    const existingItem = await getShoppingItemById(
      ctx,
      householdId,
      args.id
    );

    if (!existingItem) {
      throw new Error("Shopping item not found");
    }

    const patch = {
      ...(args.name !== undefined && { name: args.name.trim() }),
      ...(args.quantity !== undefined && {
        quantity: args.quantity?.trim() || null,
      }),
      ...(args.category !== undefined && { category: args.category.trim() }),
      ...(args.completed !== undefined && { completed: args.completed }),
      updatedAt: Date.now(),
    };

    await ctx.db.patch(existingItem._id, patch);
    return { ...existingItem, ...patch };
  },
});

export const deleteShoppingItem = internalMutation({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx);
    const existingItem = await getShoppingItemById(
      ctx,
      householdId,
      args.id
    );

    if (!existingItem) {
      throw new Error("Shopping item not found");
    }

    await ctx.db.delete(existingItem._id);
    return { id: args.id };
  },
});

export const createShoppingItemsFromMeals = internalMutation({
  args: {
    mealIds: v.array(v.string()),
    category: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const householdId = await requireHouseholdId(ctx);
    const category = args.category?.trim() || "Other";
    const mealIdSet = new Set(args.mealIds);

    const meals = await ctx.db
      .query("meals")
      .withIndex("by_householdId", (q) => q.eq("householdId", householdId))
      .collect();

    const selectedMeals = meals.filter((meal) => mealIdSet.has(meal.id));
    if (selectedMeals.length === 0) {
      throw new Error("No meals found for the selected items");
    }

    selectedMeals.sort((a, b) => a.date - b.date);

    const itemNames = dedupeItems(
      selectedMeals.flatMap((meal) => {
        const noteItems = splitMealNotes(meal.notes);
        return noteItems.length > 0 ? noteItems : [meal.name];
      })
    );

    if (itemNames.length === 0) {
      throw new Error("No shopping items found to add");
    }

    const now = Date.now();
    for (const name of itemNames) {
      await ctx.db.insert("shoppingItems", {
        id: generateId(),
        householdId,
        name,
        quantity: null,
        category,
        completed: false,
        listId: null,
        createdAt: now,
        updatedAt: now,
      });
    }

    return { count: itemNames.length };
  },
});
