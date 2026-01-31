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
  createCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
} from "./calendar";

describe("calendar server functions", () => {
  const baseDate = new Date("2026-01-19T00:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetClerkUserId.mockResolvedValue("user-1");
  });

  it("maps events to ISO dates for getCalendarEvents", async () => {
    const endDate = new Date("2026-02-01T00:00:00.000Z");
    mockConvexClient.query.mockResolvedValue([
      {
        id: "event-1",
        title: "Soccer",
        description: null,
        date: baseDate.valueOf(),
        time: "09:00",
        recurrence: "weekly",
        endDate: endDate.valueOf(),
        participantId: null,
      },
    ]);

    const result = await getCalendarEvents({ data: {} });

    expect(mockConvexClient.query).toHaveBeenCalledWith(
      expect.anything(),
      {}
    );
    expect(result).toEqual([
      {
        id: "event-1",
        title: "Soccer",
        description: undefined,
        date: baseDate.toISOString(),
        time: "09:00",
        recurrence: "weekly",
        endDate: endDate.toISOString(),
        participantId: undefined,
      },
    ]);
  });

  it("rejects createCalendarEvent when date is invalid", async () => {
    await expect(
      createCalendarEvent({
        data: {
          title: "Checkup",
          date: "not-a-date",
        },
      })
    ).rejects.toThrow("Date is invalid");
  });

  it("surfaces errors from updateCalendarEvent mutation", async () => {
    mockConvexClient.mutation.mockRejectedValue(
      new Error("Event not found or not authorized")
    );

    await expect(
      updateCalendarEvent({
        data: {
          id: "event-1",
          title: "Updated",
        },
      })
    ).rejects.toThrow("Event not found or not authorized");
  });
});
