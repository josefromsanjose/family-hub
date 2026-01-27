import { describe, it, expect, vi, beforeEach } from "vitest";

const mockPrisma = vi.hoisted(() => ({
  calendarEvent: {
    findMany: vi.fn(),
    create: vi.fn(),
    findFirst: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  householdMember: {
    findFirst: vi.fn(),
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
  createCalendarEvent,
  getCalendarEvents,
  updateCalendarEvent,
} from "./calendar";

describe("calendar server functions", () => {
  const baseDate = new Date("2026-01-19T00:00:00.000Z");

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetCurrentUserHouseholdId.mockResolvedValue("household-1");
  });

  it("maps events to ISO dates for getCalendarEvents", async () => {
    const endDate = new Date("2026-02-01T00:00:00.000Z");
    mockPrisma.calendarEvent.findMany.mockResolvedValue([
      {
        id: "event-1",
        title: "Soccer",
        description: null,
        date: baseDate,
        time: "09:00",
        recurrence: "weekly",
        endDate,
        participantId: null,
      },
    ]);

    const result = await getCalendarEvents({ data: {} });

    expect(mockPrisma.calendarEvent.findMany).toHaveBeenCalledWith({
      where: { householdId: "household-1" },
      orderBy: [{ date: "asc" }, { time: "asc" }],
    });
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

  it("rejects updateCalendarEvent when event is not found", async () => {
    mockPrisma.calendarEvent.findFirst.mockResolvedValue(null);

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
