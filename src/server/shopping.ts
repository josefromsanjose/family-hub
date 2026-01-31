import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getConvexClient } from "@/server/convex";
import { internal } from "../../convex/_generated/api";

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

type ShoppingItemRecord = {
  id: string;
  householdId: string;
  name: string;
  quantity: string | null;
  category: string;
  completed: boolean;
  listId: string | null;
  createdAt: number;
  updatedAt: number;
};

const toShoppingItemResponse = (
  item: ShoppingItemRecord
): ShoppingItemResponse => ({
  id: item.id,
  householdId: item.householdId,
  name: item.name,
  quantity: item.quantity || undefined,
  category: item.category,
  completed: item.completed,
  listId: item.listId || undefined,
  createdAt: new Date(item.createdAt).toISOString(),
  updatedAt: new Date(item.updatedAt).toISOString(),
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

export const getShoppingItems = createServerFn({ method: "GET" }).handler(
  async (): Promise<ShoppingItemResponse[]> => {
    const convex = await getConvexClient();
    const items = await convex.query(internal.shopping.getShoppingItems, {});

    return items.map(toShoppingItemResponse);
  }
);

export const createShoppingItem = createServerFn({ method: "POST" })
  .inputValidator((input: CreateShoppingItemInput) =>
    createShoppingItemSchema.parse(input)
  )
  .handler(async ({ data }): Promise<ShoppingItemResponse> => {
    const convex = await getConvexClient();
    const item = await convex.mutation(internal.shopping.createShoppingItem, {
      name: data.name.trim(),
      ...(data.quantity ? { quantity: data.quantity } : {}),
      ...(data.category ? { category: data.category } : {}),
    });

    return toShoppingItemResponse(item);
  });

export const updateShoppingItem = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateShoppingItemInput) =>
    updateShoppingItemSchema.parse(input)
  )
  .handler(async ({ data }): Promise<ShoppingItemResponse> => {
    const convex = await getConvexClient();
    const item = await convex.mutation(internal.shopping.updateShoppingItem, {
      id: data.id,
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.quantity !== undefined && { quantity: data.quantity }),
      ...(data.category !== undefined && { category: data.category }),
      ...(data.completed !== undefined && { completed: data.completed }),
    });

    return toShoppingItemResponse(item);
  });

export const deleteShoppingItem = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteShoppingItemInput) =>
    deleteShoppingItemSchema.parse(input)
  )
  .handler(async ({ data }): Promise<{ id: string }> => {
    const convex = await getConvexClient();
    return convex.mutation(internal.shopping.deleteShoppingItem, {
      id: data.id,
    });
  });

export const createShoppingItemsFromMeals = createServerFn({ method: "POST" })
  .inputValidator((input: CreateShoppingItemsFromMealsInput) => {
    return createShoppingItemsSchema.parse(input);
  })
  .handler(async ({ data }): Promise<CreateShoppingItemsFromMealsResponse> => {
    const convex = await getConvexClient();
    return convex.mutation(internal.shopping.createShoppingItemsFromMeals, {
      mealIds: data.mealIds,
      ...(data.category ? { category: data.category } : {}),
    });
  });
