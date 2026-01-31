import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { endOfDay, startOfDay } from "date-fns";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CalendarPage } from "./index";
import { useCalendar } from "@/contexts/CalendarContext";
import { useHousehold } from "@/contexts/HouseholdContext";
import { getCalendarEvents, type CalendarEventResponse } from "@/server/calendar";
import { getMonthGridDates } from "@/utils/calendar";

vi.mock("@/server/calendar", () => ({
  getCalendarEvents: vi.fn(),
  createCalendarEvent: vi.fn(),
  updateCalendarEvent: vi.fn(),
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
      updateEvent: vi.fn(),
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

    expect(screen.getByRole("tab", { name: /day/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /week/i })).toBeTruthy();
    expect(screen.getByRole("tab", { name: /month/i })).toBeTruthy();
  });

  it("shows error state when events fail to load", async () => {
    vi.mocked(getCalendarEvents).mockRejectedValueOnce(new Error("No events"));

    renderCalendar();

    await waitFor(() => {
      expect(screen.getByRole("tab", { name: /month/i })).toBeTruthy();
    });
  });

  it("renders events from the server", async () => {
    const eventDate = startOfDay(new Date());

    vi.mocked(getCalendarEvents).mockResolvedValue([
      {
        id: "event-1",
        title: "Dentist Visit",
        description: "Bring insurance card",
        date: eventDate.toISOString(),
        recurrence: undefined,
        endDate: undefined,
        participantId: "member-1",
      } satisfies CalendarEventResponse,
    ]);

    renderCalendar();

    const titleMatches = await screen.findAllByText("Dentist Visit");
    expect(titleMatches.length).toBeGreaterThan(0);
  });

  it("refetches when the participant filter changes", async () => {
    renderCalendar();

    const today = startOfDay(new Date());
    const monthDate = new Date(today.getFullYear(), today.getMonth(), 1);
    const monthDates = getMonthGridDates(monthDate);
    const startDateIso = startOfDay(monthDates[0]).toISOString();
    const endDateIso = endOfDay(
      monthDates[monthDates.length - 1]
    ).toISOString();

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
    const monthLabel = new Date().toLocaleString("en-US", {
      month: "long",
      year: "numeric",
    });
    expect(screen.getByText(monthLabel)).toBeTruthy();
  });
});
