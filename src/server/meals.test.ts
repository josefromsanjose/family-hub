import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  meal: {
    findMany: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  mealLibraryItem: {
    findMany: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
  },
}));

const mockGetCurrentUserHouseholdId = vi.hoisted(() => vi.fn());

vi.mock("@/db", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/server/household", () => ({
  getCurrentUserHouseholdId: mockGetCurrentUserHouseholdId,
}));

vi.mock("@tanstack/react-start", () => ({
  createServerFn: () => {
    let validator: ((input: unknown) => unknown) | undefined;

    return {
      inputValidator(next: (input: unknown) => unknown) {
        validator = next;
        return this;
      },
      handler(fn: (input?: { data?: unknown }) => unknown) {
        return async (input?: { data?: unknown }) => {
          if (validator && input && "data" in input) {
            validator(input.data);
          }
          return fn(input as { data?: unknown });
        };
      },
    };
  },
}));

import {
  createMeal,
  getMealById,
  getMealLibraryItems,
  getMeals,
  updateMeal,
} from "./meals";

describe("meals server functions", () => {
  const baseDate = new Date("2026-01-15T00:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUserHouseholdId.mockResolvedValue("household-1");
  });

  it("maps meals to ISO dates for getMeals", async () => {
    mockPrisma.meal.findMany.mockResolvedValue([
      {
        id: "meal-1",
        householdId: "household-1",
        name: "Pasta",
        date: baseDate,
        mealType: "dinner",
        notes: null,
        mealLibraryItemId: null,
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ]);

    const result = await getMeals({ data: {} });

    expect(mockPrisma.meal.findMany).toHaveBeenCalledWith({
      where: { householdId: "household-1" },
      orderBy: [{ date: "asc" }, { mealType: "asc" }, { createdAt: "asc" }],
    });
    expect(result).toEqual([
      {
        id: "meal-1",
        householdId: "household-1",
        name: "Pasta",
        date: baseDate.toISOString(),
        mealType: "dinner",
        mealLibraryItemId: undefined,
        createdAt: baseDate.toISOString(),
        updatedAt: baseDate.toISOString(),
      },
    ]);
  });

  it("returns a meal by id when it exists", async () => {
    mockPrisma.meal.findFirst.mockResolvedValue({
      id: "meal-1",
      householdId: "household-1",
      name: "Pasta",
      date: baseDate,
      mealType: "dinner",
      notes: null,
      mealLibraryItemId: null,
      createdAt: baseDate,
      updatedAt: baseDate,
    });

    const result = await getMealById({ data: { id: "meal-1" } });

    expect(mockPrisma.meal.findFirst).toHaveBeenCalledWith({
      where: { id: "meal-1", householdId: "household-1" },
    });
    expect(result).toEqual({
      id: "meal-1",
      householdId: "household-1",
      name: "Pasta",
      date: baseDate.toISOString(),
      mealType: "dinner",
      mealLibraryItemId: undefined,
      createdAt: baseDate.toISOString(),
      updatedAt: baseDate.toISOString(),
    });
  });

  it("returns library items for getMealLibraryItems", async () => {
    mockPrisma.mealLibraryItem.findMany.mockResolvedValue([
      {
        id: "library-1",
        householdId: "household-1",
        name: "Tacos",
        notes: "Use salsa",
        createdAt: baseDate,
        updatedAt: baseDate,
      },
    ]);

    const result = await getMealLibraryItems({ data: {} });

    expect(mockPrisma.mealLibraryItem.findMany).toHaveBeenCalledWith({
      where: { householdId: "household-1" },
      orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
    });
    expect(result).toEqual([
      {
        id: "library-1",
        householdId: "household-1",
        name: "Tacos",
        notes: "Use salsa",
        createdAt: baseDate.toISOString(),
        updatedAt: baseDate.toISOString(),
      },
    ]);
  });

  it("rejects createMeal when name is empty", async () => {
    await expect(
      createMeal({
        data: {
          name: "   ",
          date: baseDate.toISOString(),
          mealType: "dinner",
        },
      })
    ).rejects.toThrow("Meal name is required");
  });

  it("rejects updateMeal when meal is not found for household", async () => {
    mockPrisma.meal.findFirst.mockResolvedValue(null);

    await expect(
      updateMeal({
        data: {
          id: "meal-1",
          name: "Soup",
        },
      })
    ).rejects.toThrow("Meal not found or not authorized");
  });
});
