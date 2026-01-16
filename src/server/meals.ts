import { createServerFn } from "@tanstack/react-start";
import { MealType } from "@prisma/client";
import { prisma } from "@/db";
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
  createdAt: string;
  updatedAt: string;
};

export type CreateMealInput = {
  name: string;
  date: string; // ISO string
  mealType: "breakfast" | "lunch" | "dinner";
  notes?: string;
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

const toMealResponse = (meal: {
  id: string;
  householdId: string;
  name: string;
  date: Date;
  mealType: MealType;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}): MealResponse => ({
  id: meal.id,
  householdId: meal.householdId,
  name: meal.name,
  date: meal.date.toISOString(),
  mealType: meal.mealType as MealResponse["mealType"],
  notes: meal.notes || undefined,
  createdAt: meal.createdAt.toISOString(),
  updatedAt: meal.updatedAt.toISOString(),
});

// ============================================================================
// GET Operations
// ============================================================================

export const getMeals = createServerFn({ method: "GET" }).handler(
  async (): Promise<MealResponse[]> => {
    const householdId = await getCurrentUserHouseholdId();

    const meals = await prisma.meal.findMany({
      where: { householdId },
      orderBy: [{ date: "asc" }, { mealType: "asc" }, { createdAt: "asc" }],
    });

    return meals.map(toMealResponse);
  }
);

// ============================================================================
// POST Operations
// ============================================================================

export const createMeal = createServerFn({ method: "POST" })
  .inputValidator((input: CreateMealInput) => {
    if (!input.name || input.name.trim().length === 0) {
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

    const meal = await prisma.meal.create({
      data: {
        householdId,
        name: data.name.trim(),
        date: new Date(data.date),
        mealType: data.mealType as MealType,
        notes: data.notes?.trim() || null,
      },
    });

    return toMealResponse(meal);
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

    const existingMeal = await prisma.meal.findFirst({
      where: { id: data.id, householdId },
    });

    if (!existingMeal) {
      throw new Error("Meal not found or not authorized");
    }

    await prisma.meal.delete({ where: { id: data.id } });

    return { success: true };
  });
