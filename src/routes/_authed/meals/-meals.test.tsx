import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { addDays, addWeeks, format, startOfWeek } from "date-fns";
import { afterEach, describe, it, expect, vi } from "vitest";
import type { ComponentProps } from "react";
import { MealPlanning } from "./index";
import {
  createMeal,
  getMealLibraryItems,
  getMeals,
  type MealResponse,
} from "@/server/meals";
import { createShoppingItemsFromMeals } from "@/server/shopping";

vi.mock("@/server/meals", () => ({
  createMeal: vi.fn(),
  getMeals: vi.fn(),
  deleteMeal: vi.fn(),
  getMealLibraryItems: vi.fn(),
}));
vi.mock("@/server/shopping", () => ({
  createShoppingItemsFromMeals: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

afterEach(() => {
  cleanup();
});

const renderMealPlanning = (props?: ComponentProps<typeof MealPlanning>) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MealPlanning {...props} />
    </QueryClientProvider>
  );
};

describe("MealPlanning", () => {
  const formatWeekRange = (startDate: Date, endDate: Date) => {
    const sameMonth =
      startDate.getFullYear() === endDate.getFullYear() &&
      startDate.getMonth() === endDate.getMonth();
    if (sameMonth) {
      return `${format(startDate, "MMMM d")}-${format(endDate, "d, yyyy")}`;
    }
    return `${format(startDate, "MMMM d")}-${format(endDate, "MMMM d, yyyy")}`;
  };

  it("shows loading state while meals are fetching", () => {
    vi.mocked(getMeals).mockReturnValue(
      new Promise<MealResponse[]>(() => {}) as Promise<MealResponse[]>
    );

    renderMealPlanning();

    expect(screen.getByText(/loading meals/i)).toBeTruthy();
  });

  it("shows error state when meals fail to load", async () => {
    vi.mocked(getMeals).mockRejectedValueOnce(new Error("No meals"));

    renderMealPlanning();

    expect(await screen.findByText(/error loading meals/i)).toBeTruthy();
  });

  it("renders meals from the server", async () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const wednesday = addDays(weekStart, 2);
    vi.mocked(getMeals).mockResolvedValueOnce([
      {
        id: "meal-1",
        householdId: "house-1",
        name: "Family Chili",
        date: wednesday.toISOString(),
        mealType: "dinner",
        notes: "Add cornbread",
        createdAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
        updatedAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
      },
    ]);

    renderMealPlanning();

    expect(await screen.findByText("Family Chili")).toBeTruthy();
    expect(screen.getByText("Add cornbread")).toBeTruthy();
  });

  it("shows week navigation and updates range when navigating", async () => {
    vi.mocked(getMeals).mockResolvedValue([]);

    renderMealPlanning();

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    expect(
      await screen.findByText(formatWeekRange(weekStart, weekEnd))
    ).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: /next week/i }));
    const nextWeekStart = addWeeks(weekStart, 1);
    const nextWeekEnd = addDays(nextWeekStart, 6);
    expect(
      await screen.findByText(formatWeekRange(nextWeekStart, nextWeekEnd))
    ).toBeTruthy();
  });

  it("routes to create new meal from the header button", async () => {
    vi.mocked(getMeals).mockResolvedValueOnce([]);
    vi.mocked(getMealLibraryItems).mockResolvedValueOnce([]);
    const onCreateNewMeal = vi.fn();

    const { container } = renderMealPlanning({ onCreateNewMeal });

    await waitFor(() => {
      expect(
        within(container).queryByRole("button", { name: /create meal/i })
      ).toBeTruthy();
    });
    const createMealButton = within(container).getByRole("button", {
      name: /create meal/i,
    });
    fireEvent.click(createMealButton);
    expect(onCreateNewMeal).toHaveBeenCalledWith(expect.any(Date));
  });

  it("opens the add meal sheet from the header button", async () => {
    vi.mocked(getMeals).mockResolvedValueOnce([]);
    vi.mocked(getMealLibraryItems).mockResolvedValueOnce([]);

    const { container } = renderMealPlanning();

    const addMealButton = await within(container).findByRole("button", {
      name: /add meal/i,
    });
    fireEvent.click(addMealButton);

    await waitFor(() => {
      expect(screen.getByText(/pick a meal/i)).toBeTruthy();
    });
  });

  it("adds an existing meal from the wizard", async () => {
    vi.mocked(getMeals).mockResolvedValueOnce([]);
    vi.mocked(getMealLibraryItems).mockImplementation(({ data }) =>
      Promise.resolve(
        data.query
          ? [
              {
                id: "library-1",
                householdId: "house-1",
                name: "Taco Night",
                notes: "Add lime",
                createdAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
                updatedAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
              },
            ]
          : []
      )
    );
    vi.mocked(createMeal).mockResolvedValueOnce({
      id: "meal-1",
      householdId: "house-1",
      name: "Taco Night",
      date: new Date("2026-01-15T12:00:00.000Z").toISOString(),
      mealType: "dinner",
      notes: "Add lime",
      createdAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
    });

    renderMealPlanning();

    fireEvent.click(await screen.findByRole("button", { name: /add meal/i }));
    const dialog = await screen.findByRole("dialog", { name: /pick a meal/i });
    const dialogScope = within(dialog);
    fireEvent.change(dialogScope.getByLabelText(/search meals/i), {
      target: { value: "taco" },
    });
    fireEvent.click(
      await dialogScope.findByRole("button", { name: /select taco night/i })
    );
    fireEvent.click(await dialogScope.findByRole("button", { name: /monday/i }));
    fireEvent.click(
      await dialogScope.findByRole("button", { name: /dinner/i })
    );
    fireEvent.click(await screen.findByRole("button", { name: /add to week/i }));

    await waitFor(() => {
      expect(createMeal).toHaveBeenCalledWith(
        {
          data: expect.objectContaining({
            mealLibraryItemId: "library-1",
            mealType: expect.any(String),
            date: expect.any(String),
          }),
        },
        expect.anything()
      );
    });
  });

  it("generates a shopping list from selected meals", async () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const monday = weekStart;
    const tuesday = addDays(weekStart, 1);
    vi.mocked(getMeals).mockResolvedValueOnce([
      {
        id: "meal-1",
        householdId: "house-1",
        name: "Family Chili",
        date: monday.toISOString(),
        mealType: "dinner",
        notes: "Beans, tomatoes",
        createdAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
        updatedAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
      },
      {
        id: "meal-2",
        householdId: "house-1",
        name: "Veggie Wraps",
        date: tuesday.toISOString(),
        mealType: "lunch",
        notes: "Hummus, spinach",
        createdAt: new Date("2026-01-11T12:00:00.000Z").toISOString(),
        updatedAt: new Date("2026-01-11T12:00:00.000Z").toISOString(),
      },
    ]);
    vi.mocked(createShoppingItemsFromMeals).mockResolvedValueOnce({ count: 3 });

    const onNavigateToShopping = vi.fn();

    renderMealPlanning({ onNavigateToShopping });

    fireEvent.click(
      await screen.findByRole("button", { name: /generate shopping list/i })
    );

    const dialog = await screen.findByRole("dialog", {
      name: /generate shopping list/i,
    });
    const dialogScope = within(dialog);
    fireEvent.click(dialogScope.getByLabelText(/select veggie wraps/i));
    fireEvent.click(dialogScope.getByRole("button", { name: /generate list/i }));

    await waitFor(() => {
      expect(createShoppingItemsFromMeals).toHaveBeenCalledWith(
        { data: { mealIds: ["meal-1"] } },
        expect.anything()
      );
    });
    await waitFor(() => {
      expect(onNavigateToShopping).toHaveBeenCalled();
    });
  });

  it("calls onEditMeal when edit is pressed", async () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const thursday = addDays(weekStart, 3);
    const meal = {
      id: "meal-3",
      householdId: "house-1",
      name: "Pasta Night",
      date: thursday.toISOString(),
      mealType: "dinner",
      notes: "Use gluten-free noodles",
      createdAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
    };
    vi.mocked(getMeals).mockResolvedValueOnce([meal as MealResponse]);
    const onEditMeal = vi.fn();

    renderMealPlanning({ onEditMeal });

    fireEvent.click(await screen.findByRole("button", { name: /edit meal/i }));
    expect(onEditMeal).toHaveBeenCalledWith(
      expect.objectContaining(meal),
      expect.any(Date)
    );
  });
});
