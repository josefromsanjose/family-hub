import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getPrisma } from "@/server/db";
import { getCurrentUserHouseholdId } from "@/server/household";

export type ShoppingItemResponse = {
  id: string;
  householdId: string;
  name: string;
  quantity?: string;
  category: string;
  completed: boolean;
  listId?: string;
  createdAt: string;
  updatedAt: string;
};

const toShoppingItemResponse = (item: {
  id: string;
  householdId: string;
  name: string;
  quantity: string | null;
  category: string;
  completed: boolean;
  listId: string | null;
  createdAt: Date;
  updatedAt: Date;
}): ShoppingItemResponse => ({
  id: item.id,
  householdId: item.householdId,
  name: item.name,
  quantity: item.quantity || undefined,
  category: item.category,
  completed: item.completed,
  listId: item.listId || undefined,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

const createShoppingItemSchema = z.object({
  name: z.string().trim().min(1, "Item name is required"),
  quantity: z.string().trim().optional(),
  category: z.string().trim().optional(),
});

const updateShoppingItemSchema = z.object({
  id: z.string().min(1, "Item id is required"),
  name: z.string().trim().min(1).optional(),
  quantity: z.string().trim().optional().nullable(),
  category: z.string().trim().min(1).optional(),
  completed: z.boolean().optional(),
});

const deleteShoppingItemSchema = z.object({
  id: z.string().min(1, "Item id is required"),
});

const createShoppingItemsSchema = z.object({
  mealIds: z.array(z.string().min(1)).min(1, "Select at least one meal"),
  category: z.string().optional(),
});

export type CreateShoppingItemsFromMealsInput = z.infer<
  typeof createShoppingItemsSchema
>;

export type CreateShoppingItemsFromMealsResponse = {
  count: number;
};

export type CreateShoppingItemInput = z.infer<typeof createShoppingItemSchema>;
export type UpdateShoppingItemInput = z.infer<typeof updateShoppingItemSchema>;
export type DeleteShoppingItemInput = z.infer<typeof deleteShoppingItemSchema>;

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

export const getShoppingItems = createServerFn({ method: "GET" }).handler(
  async (): Promise<ShoppingItemResponse[]> => {
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    const items = await prisma.shoppingItem.findMany({
      where: { householdId },
      orderBy: [{ completed: "asc" }, { category: "asc" }, { createdAt: "desc" }],
    });

    return items.map(toShoppingItemResponse);
  }
);

export const createShoppingItem = createServerFn({ method: "POST" })
  .inputValidator((input: CreateShoppingItemInput) =>
    createShoppingItemSchema.parse(input)
  )
  .handler(async ({ data }): Promise<ShoppingItemResponse> => {
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();
    const category = data.category?.trim() || "Other";
    const quantity = data.quantity?.trim() || null;

    const item = await prisma.shoppingItem.create({
      data: {
        householdId,
        name: data.name.trim(),
        quantity,
        category,
        completed: false,
      },
    });

    return toShoppingItemResponse(item);
  });

export const updateShoppingItem = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateShoppingItemInput) =>
    updateShoppingItemSchema.parse(input)
  )
  .handler(async ({ data }): Promise<ShoppingItemResponse> => {
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    const existingItem = await prisma.shoppingItem.findFirst({
      where: { id: data.id, householdId },
    });

    if (!existingItem) {
      throw new Error("Shopping item not found");
    }

    const item = await prisma.shoppingItem.update({
      where: { id: data.id },
      data: {
        name: data.name?.trim(),
        quantity:
          data.quantity === undefined
            ? undefined
            : data.quantity?.trim() || null,
        category: data.category?.trim(),
        completed: data.completed,
      },
    });

    return toShoppingItemResponse(item);
  });

export const deleteShoppingItem = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteShoppingItemInput) =>
    deleteShoppingItemSchema.parse(input)
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    const existingItem = await prisma.shoppingItem.findFirst({
      where: { id: data.id, householdId },
    });

    if (!existingItem) {
      throw new Error("Shopping item not found");
    }

    await prisma.shoppingItem.delete({ where: { id: data.id } });

    return { id: data.id };
  });

export const createShoppingItemsFromMeals = createServerFn({ method: "POST" })
  .inputValidator((input: CreateShoppingItemsFromMealsInput) => {
    return createShoppingItemsSchema.parse(input);
  })
  .handler(async ({ data }): Promise<CreateShoppingItemsFromMealsResponse> => {
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();
    const category = data.category?.trim() || "Other";

    const meals = await prisma.meal.findMany({
      where: { householdId, id: { in: data.mealIds } },
      select: { id: true, name: true, notes: true },
      orderBy: { date: "asc" },
    });

    if (meals.length === 0) {
      throw new Error("No meals found for the selected items");
    }

    const itemNames = dedupeItems(
      meals.flatMap((meal) => {
        const noteItems = splitMealNotes(meal.notes);
        return noteItems.length > 0 ? noteItems : [meal.name];
      })
    );

    if (itemNames.length === 0) {
      throw new Error("No shopping items found to add");
    }

    const result = await prisma.shoppingItem.createMany({
      data: itemNames.map((name) => ({
        householdId,
        name,
        category,
      })),
    });

    return { count: result.count };
  });
