import { createServerFn } from "@tanstack/react-start";
import { getClerkUserId } from "@/server/clerk";
import { getConvexClient } from "@/server/convex";
import { internal } from "../../convex/_generated/api";

// ============================================================================
// Type Definitions
// ============================================================================

export type MealResponse = {
  id: string;
  householdId: string;
  name: string;
  date: string; // ISO string
  mealType: "breakfast" | "lunch" | "dinner";
  notes?: string;
  mealLibraryItemId?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateMealInput = {
  name?: string;
  date: string; // ISO string
  mealType: "breakfast" | "lunch" | "dinner";
  notes?: string;
  mealLibraryItemId?: string;
};

export type UpdateMealInput = {
  id: string;
  name?: string;
  date?: string;
  mealType?: "breakfast" | "lunch" | "dinner";
  notes?: string | null;
};

export type DeleteMealInput = {
  id: string;
};

export type GetMealsInput = {
  startDate?: string;
  endDate?: string;
};

export type GetMealByIdInput = {
  id: string;
};

export type MealLibraryItemResponse = {
  id: string;
  householdId: string;
  name: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateMealLibraryItemInput = {
  name: string;
  notes?: string;
};

export type GetMealLibraryItemsInput = {
  query?: string;
};

type MealRecord = {
  id: string;
  householdId: string;
  name: string;
  date: number;
  mealType: MealResponse["mealType"];
  notes: string | null;
  mealLibraryItemId: string | null;
  createdAt: number;
  updatedAt: number;
};

type MealLibraryItemRecord = {
  id: string;
  householdId: string;
  name: string;
  notes: string | null;
  createdAt: number;
  updatedAt: number;
};

const toMealResponse = (meal: MealRecord): MealResponse => ({
  id: meal.id,
  householdId: meal.householdId,
  name: meal.name,
  date: new Date(meal.date).toISOString(),
  mealType: meal.mealType,
  notes: meal.notes || undefined,
  mealLibraryItemId: meal.mealLibraryItemId || undefined,
  createdAt: new Date(meal.createdAt).toISOString(),
  updatedAt: new Date(meal.updatedAt).toISOString(),
});

const toMealLibraryItemResponse = (
  item: MealLibraryItemRecord
): MealLibraryItemResponse => ({
  id: item.id,
  householdId: item.householdId,
  name: item.name,
  notes: item.notes || undefined,
  createdAt: new Date(item.createdAt).toISOString(),
  updatedAt: new Date(item.updatedAt).toISOString(),
});

// ============================================================================
// GET Operations
// ============================================================================

export const getMeals = createServerFn({ method: "GET" })
  .inputValidator((input: GetMealsInput) => {
    const startDate = input.startDate ? new Date(input.startDate) : null;
    const endDate = input.endDate ? new Date(input.endDate) : null;

    if (startDate && Number.isNaN(startDate.valueOf())) {
      throw new Error("Start date is invalid");
    }
    if (endDate && Number.isNaN(endDate.valueOf())) {
      throw new Error("End date is invalid");
    }
    if (startDate && endDate && startDate > endDate) {
      throw new Error("Start date must be before end date");
    }

    return input;
  })
  .handler(async ({ data }): Promise<MealResponse[]> => {
    const userId = await getClerkUserId();
    const convex = getConvexClient();
    const meals = await convex.query(internal.meals.getMeals, {
      clerkUserId: userId,
      ...(data.startDate ? { startDate: data.startDate } : {}),
      ...(data.endDate ? { endDate: data.endDate } : {}),
    });

    return meals.map(toMealResponse);
  });

export const getMealById = createServerFn({ method: "GET" })
  .inputValidator((input: GetMealByIdInput) => {
    if (!input.id) {
      throw new Error("Meal ID is required");
    }
    return input;
  })
  .handler(async ({ data }): Promise<MealResponse | null> => {
    const userId = await getClerkUserId();
    const convex = getConvexClient();
    const meal = await convex.query(internal.meals.getMealById, {
      clerkUserId: userId,
      id: data.id,
    });

    return meal ? toMealResponse(meal) : null;
  });

export const getMealLibraryItems = createServerFn({ method: "GET" })
  .inputValidator((input: GetMealLibraryItemsInput) => {
    const query = input.query?.trim();
    return { query: query && query.length > 0 ? query : undefined };
  })
  .handler(async ({ data }): Promise<MealLibraryItemResponse[]> => {
    const userId = await getClerkUserId();
    const convex = getConvexClient();
    const items = await convex.query(internal.meals.getMealLibraryItems, {
      clerkUserId: userId,
      ...(data.query ? { query: data.query } : {}),
    });

    return items.map(toMealLibraryItemResponse);
  });

// ============================================================================
// POST Operations
// ============================================================================

export const createMeal = createServerFn({ method: "POST" })
  .inputValidator((input: CreateMealInput) => {
    if (!input.mealLibraryItemId && (!input.name || input.name.trim().length === 0)) {
      throw new Error("Meal name is required");
    }
    if (!input.date) {
      throw new Error("Meal date is required");
    }
    const parsedDate = new Date(input.date);
    if (Number.isNaN(parsedDate.valueOf())) {
      throw new Error("Meal date is invalid");
    }
    if (!input.mealType) {
      throw new Error("Meal type is required");
    }
    return input;
  })
  .handler(async ({ data }): Promise<MealResponse> => {
    const userId = await getClerkUserId();
    const convex = getConvexClient();
    const meal = await convex.mutation(internal.meals.createMeal, {
      clerkUserId: userId,
      ...(data.name !== undefined ? { name: data.name.trim() } : {}),
      date: data.date,
      mealType: data.mealType,
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
      ...(data.mealLibraryItemId
        ? { mealLibraryItemId: data.mealLibraryItemId }
        : {}),
    });

    return toMealResponse(meal);
  });

export const createMealLibraryItem = createServerFn({ method: "POST" })
  .inputValidator((input: CreateMealLibraryItemInput) => {
    if (!input.name || input.name.trim().length === 0) {
      throw new Error("Meal name is required");
    }
    return input;
  })
  .handler(async ({ data }): Promise<MealLibraryItemResponse> => {
    const userId = await getClerkUserId();
    const convex = getConvexClient();
    const item = await convex.mutation(internal.meals.createMealLibraryItem, {
      clerkUserId: userId,
      name: data.name.trim(),
      ...(data.notes !== undefined ? { notes: data.notes } : {}),
    });

    return toMealLibraryItemResponse(item);
  });

export const updateMeal = createServerFn({ method: "POST" })
  .inputValidator((input: UpdateMealInput) => {
    if (!input.id) {
      throw new Error("Meal ID is required");
    }
    if (input.name !== undefined && input.name.trim().length === 0) {
      throw new Error("Meal name is required");
    }
    if (input.date !== undefined) {
      const parsedDate = new Date(input.date);
      if (Number.isNaN(parsedDate.valueOf())) {
        throw new Error("Meal date is invalid");
      }
    }
    return input;
  })
  .handler(async ({ data }): Promise<MealResponse> => {
    const userId = await getClerkUserId();
    const convex = getConvexClient();
    const meal = await convex.mutation(internal.meals.updateMeal, {
      clerkUserId: userId,
      id: data.id,
      ...(data.name !== undefined && { name: data.name.trim() }),
      ...(data.date !== undefined && { date: data.date }),
      ...(data.mealType !== undefined && { mealType: data.mealType }),
      ...(data.notes !== undefined && { notes: data.notes }),
    });

    return toMealResponse(meal);
  });

export const deleteMeal = createServerFn({ method: "POST" })
  .inputValidator((input: DeleteMealInput) => {
    if (!input.id) {
      throw new Error("Meal ID is required");
    }
    return input;
  })
  .handler(async ({ data }): Promise<{ success: boolean }> => {
    const userId = await getClerkUserId();
    const convex = getConvexClient();
    return convex.mutation(internal.meals.deleteMeal, {
      clerkUserId: userId,
      id: data.id,
    });
  });
