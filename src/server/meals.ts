import { createServerFn } from "@tanstack/react-start";
import type { MealType } from "@prisma/client";
import { getPrisma } from "@/server/db";
import { getCurrentUserHouseholdId } from "@/server/household";

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

const toMealResponse = (meal: {
  id: string;
  householdId: string;
  name: string;
  date: Date;
  mealType: MealType;
  notes: string | null;
  mealLibraryItemId?: string | null;
  createdAt: Date;
  updatedAt: Date;
}): MealResponse => ({
  id: meal.id,
  householdId: meal.householdId,
  name: meal.name,
  date: meal.date.toISOString(),
  mealType: meal.mealType as MealResponse["mealType"],
  notes: meal.notes || undefined,
  mealLibraryItemId: meal.mealLibraryItemId || undefined,
  createdAt: meal.createdAt.toISOString(),
  updatedAt: meal.updatedAt.toISOString(),
});

const toMealLibraryItemResponse = (item: {
  id: string;
  householdId: string;
  name: string;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): MealLibraryItemResponse => ({
  id: item.id,
  householdId: item.householdId,
  name: item.name,
  notes: item.notes || undefined,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
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
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();
    const startDate = data.startDate ? new Date(data.startDate) : null;
    const endDate = data.endDate ? new Date(data.endDate) : null;

    const meals = await prisma.meal.findMany({
      where: {
        householdId,
        ...(startDate || endDate
          ? {
              date: {
                ...(startDate ? { gte: startDate } : {}),
                ...(endDate ? { lte: endDate } : {}),
              },
            }
          : {}),
      },
      orderBy: [{ date: "asc" }, { mealType: "asc" }, { createdAt: "asc" }],
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
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    const meal = await prisma.meal.findFirst({
      where: { id: data.id, householdId },
    });

    return meal ? toMealResponse(meal) : null;
  });

export const getMealLibraryItems = createServerFn({ method: "GET" })
  .inputValidator((input: GetMealLibraryItemsInput) => {
    const query = input.query?.trim();
    return { query: query && query.length > 0 ? query : undefined };
  })
  .handler(async ({ data }): Promise<MealLibraryItemResponse[]> => {
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    const items = await prisma.mealLibraryItem.findMany({
      where: {
        householdId,
        ...(data.query
          ? { name: { contains: data.query, mode: "insensitive" } }
          : {}),
      },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
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
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();
    let name = data.name?.trim() ?? "";
    let notes = data.notes?.trim() || null;

    if (data.mealLibraryItemId) {
      const libraryItem = await prisma.mealLibraryItem.findFirst({
        where: { id: data.mealLibraryItemId, householdId },
      });
      if (!libraryItem) {
        throw new Error("Meal library item not found or not authorized");
      }
      name = libraryItem.name.trim();
      notes = libraryItem.notes?.trim() || null;
    }

    const meal = await prisma.meal.create({
      data: {
        householdId,
        name,
        date: new Date(data.date),
        mealType: data.mealType as MealType,
        notes,
        mealLibraryItemId: data.mealLibraryItemId ?? null,
      },
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
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    const item = await prisma.mealLibraryItem.create({
      data: {
        householdId,
        name: data.name.trim(),
        notes: data.notes?.trim() || null,
      },
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
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    const existingMeal = await prisma.meal.findFirst({
      where: { id: data.id, householdId },
    });

    if (!existingMeal) {
      throw new Error("Meal not found or not authorized");
    }

    const meal = await prisma.meal.update({
      where: { id: data.id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.date !== undefined && { date: new Date(data.date) }),
        ...(data.mealType !== undefined && {
          mealType: data.mealType as MealType,
        }),
        ...(data.notes !== undefined && {
          notes: data.notes?.trim() || null,
        }),
      },
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
    const householdId = await getCurrentUserHouseholdId();
    const prisma = await getPrisma();

    const existingMeal = await prisma.meal.findFirst({
      where: { id: data.id, householdId },
    });

    if (!existingMeal) {
      throw new Error("Meal not found or not authorized");
    }

    await prisma.meal.delete({ where: { id: data.id } });

    return { success: true };
  });
