import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { startOfWeek, addDays, format, startOfDay } from "date-fns";
import { describe, it, expect, vi } from "vitest";
import type { ReactElement } from "react";
import { MealCreateWizard } from "./new";
import { MealEditPage } from "./$mealId.edit";
import { createMeal, updateMeal } from "@/server/meals";

vi.mock("@/server/meals", () => ({
  createMeal: vi.fn(),
  updateMeal: vi.fn(),
  deleteMeal: vi.fn(),
}));

const renderWithQuery = (ui: ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
};

describe("Meal creation and edit flows", () => {
  it("creates a meal through the wizard", async () => {
    vi.mocked(createMeal).mockResolvedValueOnce({
      id: "meal-1",
      householdId: "house-1",
      name: "Tacos",
      date: new Date("2026-01-15T12:00:00.000Z").toISOString(),
      mealType: "dinner",
      createdAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
    });
    const onComplete = vi.fn();
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const selectedDay = addDays(weekStart, 2);
    const selectedDayLabel = format(selectedDay, "EEEE");
    const expectedDate = startOfDay(selectedDay).toISOString();

    renderWithQuery(
      <MealCreateWizard initialWeekStart={weekStart} onComplete={onComplete} />
    );

    fireEvent.click(
      screen.getByRole("button", { name: new RegExp(selectedDayLabel, "i") })
    );
    fireEvent.click(screen.getByRole("button", { name: /next/i }));
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    fireEvent.change(screen.getByLabelText(/meal name/i), {
      target: { value: "Tacos" },
    });
    fireEvent.click(screen.getByRole("button", { name: /next/i }));

    fireEvent.click(screen.getByRole("button", { name: /skip this step/i }));
    fireEvent.click(screen.getByRole("button", { name: /add meal/i }));

    await waitFor(() => {
      expect(createMeal).toHaveBeenCalledWith(
        {
          data: expect.objectContaining({
            name: "Tacos",
            date: expectedDate,
            mealType: expect.any(String),
          }),
        },
        expect.anything()
      );
    });
    expect(onComplete).toHaveBeenCalled();
  });

  it("updates a meal from the edit page", async () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const tuesday = addDays(weekStart, 1);
    const initialMeal = {
      id: "meal-2",
      householdId: "house-1",
      name: "Pasta Night",
      date: tuesday.toISOString(),
      mealType: "dinner" as const,
      notes: "Use gluten-free noodles",
      createdAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
    };

    vi.mocked(updateMeal).mockResolvedValueOnce({
      ...initialMeal,
      name: "Updated Pasta",
    });
    const onComplete = vi.fn();

    renderWithQuery(
      <MealEditPage
        mealId="meal-2"
        initialMeal={initialMeal}
        fallbackWeekStart={weekStart}
        onComplete={onComplete}
      />
    );

    fireEvent.change(screen.getByLabelText(/meal name/i), {
      target: { value: "Updated Pasta" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save changes/i }));

    await waitFor(() => {
      expect(updateMeal).toHaveBeenCalledWith(
        {
          data: expect.objectContaining({
            id: "meal-2",
            name: "Updated Pasta",
            date: expect.any(String),
            mealType: "dinner",
          }),
        },
        expect.anything()
      );
    });
    expect(onComplete).toHaveBeenCalled();
  });
});
