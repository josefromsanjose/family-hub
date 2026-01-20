import type { ReactNode } from "react";
import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Dashboard } from "./index";
import { getMeals, type MealResponse } from "@/server/meals";

vi.mock("@/server/meals", () => ({
  getMeals: vi.fn(),
}));

vi.mock("@/contexts/HouseholdContext", () => ({
  useHousehold: () => ({
    members: [],
    isLoading: false,
    error: null,
    addMember: vi.fn(),
    updateMember: vi.fn(),
    deleteMember: vi.fn(),
    getMemberById: vi.fn(),
  }),
}));

vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<typeof import("@tanstack/react-router")>(
    "@tanstack/react-router"
  );
  return {
    ...actual,
    Link: ({
      to,
      children,
      ...props
    }: {
      to?: string;
      children?: ReactNode;
      className?: string;
    }) => (
      <a href={typeof to === "string" ? to : "#"} {...props}>
        {children}
      </a>
    ),
  };
});

const renderDashboard = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Dashboard />
    </QueryClientProvider>
  );
};

const buildMeal = (overrides?: Partial<MealResponse>): MealResponse => ({
  id: "meal-1",
  householdId: "house-1",
  name: "Pasta Night",
  date: new Date("2026-01-15T12:00:00.000Z").toISOString(),
  mealType: "dinner",
  notes: "Add salad",
  createdAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
  updatedAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
  ...overrides,
});

beforeEach(() => {
  vi.mocked(getMeals).mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Dashboard", () => {
  it("shows meal count for the current week", async () => {
    vi.mocked(getMeals).mockResolvedValueOnce([
      buildMeal({ id: "meal-1" }),
      buildMeal({ id: "meal-2", name: "Taco Night" }),
    ]);

    renderDashboard();

    expect(await screen.findByText("2 planned")).toBeTruthy();
  });

  it("shows 0 planned when no meals are returned", async () => {
    vi.mocked(getMeals).mockResolvedValueOnce([]);

    renderDashboard();

    expect(await screen.findByText("0 planned")).toBeTruthy();
  });

  it("shows loading state while meals are fetching", () => {
    vi.mocked(getMeals).mockReturnValue(
      new Promise<MealResponse[]>(() => {}) as Promise<MealResponse[]>
    );

    renderDashboard();

    expect(screen.getByText("Loading...")).toBeTruthy();
  });
});
