import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { addDays, addWeeks, format, startOfWeek } from "date-fns";
import { describe, it, expect, vi } from "vitest";
import { MealPlanning } from "./index";
import { getMeals, createMeal, type MealResponse } from "@/server/meals";

vi.mock("@/server/meals", () => ({
  getMeals: vi.fn(),
  createMeal: vi.fn(),
  deleteMeal: vi.fn(),
}));

const renderMealPlanning = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MealPlanning />
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

  it("submits new meals through the create mutation", async () => {
    vi.mocked(getMeals).mockResolvedValueOnce([]);
    vi.mocked(createMeal).mockResolvedValueOnce({
      id: "meal-2",
      householdId: "house-1",
      name: "Tacos",
      date: new Date("2026-01-15T12:00:00.000Z").toISOString(),
      mealType: "breakfast",
      createdAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
    });

    renderMealPlanning();

    const [addMealToggle] = await screen.findAllByRole("button", {
      name: /add meal/i,
    });
    fireEvent.click(addMealToggle);
    fireEvent.change(screen.getByLabelText(/meal name/i), {
      target: { value: "Tacos" },
    });
    await screen.findByDisplayValue("Tacos");
    const addButtons = screen.getAllByRole("button", { name: /^add meal$/i });
    fireEvent.click(addButtons[1]);

    await waitFor(() => {
      expect(createMeal).toHaveBeenCalledWith(
        {
          data: expect.objectContaining({
            name: "Tacos",
            mealType: "breakfast",
            date: expect.any(String),
          }),
        },
        expect.anything()
      );
    });
  });
});
