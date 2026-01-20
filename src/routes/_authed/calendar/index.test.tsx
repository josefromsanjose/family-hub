import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { addDays, endOfDay, startOfDay, startOfWeek } from "date-fns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarPage } from "./index";
import { useCalendar } from "@/contexts/CalendarContext";
import { useHousehold } from "@/contexts/HouseholdContext";
import { getCalendarEvents, type CalendarEventResponse } from "@/server/calendar";

vi.mock("@/server/calendar", () => ({
  getCalendarEvents: vi.fn(),
  createCalendarEvent: vi.fn(),
  deleteCalendarEvent: vi.fn(),
}));

vi.mock("@/contexts/CalendarContext", () => ({
  useCalendar: vi.fn(),
}));

vi.mock("@/contexts/HouseholdContext", () => ({
  useHousehold: vi.fn(),
}));

const renderCalendar = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <CalendarPage />
    </QueryClientProvider>
  );
};

describe("CalendarPage", () => {
  beforeEach(() => {
    vi.mocked(getCalendarEvents).mockResolvedValue([]);
    vi.mocked(useCalendar).mockReturnValue({
      events: [],
      isLoading: false,
      error: null,
      addEvent: vi.fn(),
      deleteEvent: vi.fn(),
    });
    vi.mocked(useHousehold).mockReturnValue({
      members: [
        {
          id: "member-1",
          name: "Liam",
          role: "child",
          locale: "en",
          relation: null,
          relationLabel: null,
          color: "bg-blue-500",
          clerkUserId: null,
        },
      ],
      isLoading: false,
      error: null,
      addMember: vi.fn(),
      updateMember: vi.fn(),
      deleteMember: vi.fn(),
      getMemberById: vi.fn(),
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("shows loading state while events are fetching", () => {
    vi.mocked(getCalendarEvents).mockReturnValue(
      new Promise<CalendarEventResponse[]>(() => {})
    );

    renderCalendar();

    expect(screen.getAllByText(/loading events/i).length).toBeGreaterThan(0);
  });

  it("shows error state when events fail to load", async () => {
    vi.mocked(getCalendarEvents).mockRejectedValueOnce(new Error("No events"));

    renderCalendar();

    const errorMessages = await screen.findAllByText(/error loading events/i);
    expect(errorMessages.length).toBeGreaterThan(0);
  });

  it("renders events from the server", async () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const eventDate = addDays(weekStart, 2);

    vi.mocked(getCalendarEvents).mockResolvedValueOnce([
      {
        id: "event-1",
        title: "Dentist Visit",
        description: "Bring insurance card",
        date: eventDate.toISOString(),
        type: "appointment",
        recurrence: undefined,
        endDate: undefined,
        participantId: "member-1",
      } satisfies CalendarEventResponse,
    ]);

    renderCalendar();

    const titleMatches = await screen.findAllByText("Dentist Visit");
    expect(titleMatches.length).toBeGreaterThan(0);
    expect(screen.getAllByText(/for liam/i).length).toBeGreaterThan(0);
  });

  it("refetches when the participant filter changes", async () => {
    renderCalendar();

    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const weekEnd = addDays(weekStart, 6);
    const startDateIso = startOfDay(weekStart).toISOString();
    const endDateIso = endOfDay(weekEnd).toISOString();

    await waitFor(() => {
      expect(getCalendarEvents).toHaveBeenCalledWith({
        data: {
          startDate: startDateIso,
          endDate: endDateIso,
        },
      });
    });

    fireEvent.click(screen.getByRole("button", { name: /select liam/i }));

    await waitFor(() => {
      expect(getCalendarEvents).toHaveBeenCalledWith({
        data: {
          startDate: startDateIso,
          endDate: endDateIso,
          participantId: "member-1",
        },
      });
    });
  });

  it("renders the view switcher controls", () => {
    renderCalendar();

    expect(screen.getByRole("tab", { name: /day/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /week/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /month/i })).toBeTruthy();
    expect(screen.getByRole("heading", { name: "Week" })).toBeTruthy();
  });
});
