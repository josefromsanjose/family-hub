import { describe, it, expect, vi, beforeEach } from "vitest";

const mockConvexClient = vi.hoisted(() => ({
  query: vi.fn(),
  mutation: vi.fn(),
}));

const mockGetClerkUserId = vi.hoisted(() => vi.fn());

vi.mock("@/server/convex", () => ({
  getConvexClient: async () => mockConvexClient,
}));

vi.mock("@/server/clerk", () => ({
  getClerkUserId: mockGetClerkUserId,
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
    mockGetClerkUserId.mockResolvedValue("user-1");
  });

  it("maps meals to ISO dates for getMeals", async () => {
    mockConvexClient.query.mockResolvedValue([
      {
        id: "meal-1",
        householdId: "household-1",
        name: "Pasta",
        date: baseDate.valueOf(),
        mealType: "dinner",
        notes: null,
        mealLibraryItemId: null,
        createdAt: baseDate.valueOf(),
        updatedAt: baseDate.valueOf(),
      },
    ]);

    const result = await getMeals({ data: {} });

    expect(mockConvexClient.query).toHaveBeenCalledWith(
      expect.anything(),
      {}
    );
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
    mockConvexClient.query.mockResolvedValue({
      id: "meal-1",
      householdId: "household-1",
      name: "Pasta",
      date: baseDate.valueOf(),
      mealType: "dinner",
      notes: null,
      mealLibraryItemId: null,
      createdAt: baseDate.valueOf(),
      updatedAt: baseDate.valueOf(),
    });

    const result = await getMealById({ data: { id: "meal-1" } });

    expect(mockConvexClient.query).toHaveBeenCalledWith(
      expect.anything(),
      {
        id: "meal-1",
      }
    );
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
    mockConvexClient.query.mockResolvedValue([
      {
        id: "library-1",
        householdId: "household-1",
        name: "Tacos",
        notes: "Use salsa",
        createdAt: baseDate.valueOf(),
        updatedAt: baseDate.valueOf(),
      },
    ]);

    const result = await getMealLibraryItems({ data: {} });

    expect(mockConvexClient.query).toHaveBeenCalledWith(
      expect.anything(),
      {}
    );
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

  it("surfaces errors from updateMeal mutation", async () => {
    mockConvexClient.mutation.mockRejectedValue(
      new Error("Meal not found or not authorized")
    );

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
