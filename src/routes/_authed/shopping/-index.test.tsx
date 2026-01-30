import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ShoppingLists } from ".";
import {
  createShoppingItem,
  getShoppingItems,
  updateShoppingItem,
  type ShoppingItemResponse,
} from "@/server/shopping";

vi.mock("@/server/shopping", () => ({
  getShoppingItems: vi.fn(),
  createShoppingItem: vi.fn(),
  updateShoppingItem: vi.fn(),
  deleteShoppingItem: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

beforeEach(() => {
  vi.mocked(getShoppingItems).mockResolvedValue([]);
});

const renderShopping = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <ShoppingLists />
    </QueryClientProvider>
  );
};

describe("ShoppingLists", () => {
  it("renders shopping items from the server", async () => {
    vi.mocked(getShoppingItems).mockResolvedValueOnce([
      {
        id: "item-1",
        householdId: "house-1",
        name: "Milk",
        quantity: "1 gallon",
        category: "Dairy",
        completed: false,
        createdAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
        updatedAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
      },
    ] as ShoppingItemResponse[]);

    renderShopping();

    expect(await screen.findByText("Milk")).toBeTruthy();
    expect(screen.getByText("1 gallon")).toBeTruthy();
  });

  it("creates a shopping item from the add form", async () => {
    vi.mocked(getShoppingItems).mockResolvedValueOnce([]);
    vi.mocked(createShoppingItem).mockResolvedValueOnce({
      id: "item-2",
      householdId: "house-1",
      name: "Bread",
      quantity: "2 loaves",
      category: "Bakery",
      completed: false,
      createdAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
    } as ShoppingItemResponse);

    renderShopping();

    fireEvent.click(
      await screen.findByRole("button", { name: /^add item$/i })
    );
    const form = await screen.findByText("Add Shopping Item");
    const formScope = within(form.closest("div") as HTMLElement);

    fireEvent.change(formScope.getByLabelText(/item name/i), {
      target: { value: "Bread" },
    });
    fireEvent.change(formScope.getByLabelText(/quantity/i), {
      target: { value: "2 loaves" },
    });
    fireEvent.change(formScope.getByLabelText(/category/i), {
      target: { value: "Bakery" },
    });
    fireEvent.click(formScope.getByRole("button", { name: /^add item$/i }));

    await waitFor(() => {
      expect(createShoppingItem).toHaveBeenCalledWith(
        {
          data: {
            name: "Bread",
            quantity: "2 loaves",
            category: "Bakery",
          },
        },
        expect.anything()
      );
    });
  });

  it("toggles item completion", async () => {
    vi.mocked(getShoppingItems).mockResolvedValueOnce([
      {
        id: "item-3",
        householdId: "house-1",
        name: "Apples",
        quantity: "6",
        category: "Produce",
        completed: false,
        createdAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
        updatedAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
      },
    ] as ShoppingItemResponse[]);
    vi.mocked(updateShoppingItem).mockResolvedValueOnce({
      id: "item-3",
      householdId: "house-1",
      name: "Apples",
      quantity: "6",
      category: "Produce",
      completed: true,
      createdAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
      updatedAt: new Date("2026-01-10T12:00:00.000Z").toISOString(),
    } as ShoppingItemResponse);

    renderShopping();

    fireEvent.click(
      await screen.findByRole("button", { name: /mark as complete/i })
    );

    await waitFor(() => {
      expect(updateShoppingItem).toHaveBeenCalledWith(
        { data: { id: "item-3", completed: true } },
        expect.anything()
      );
    });
  });
});
