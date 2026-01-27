import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CalendarDay } from "./CalendarDay";
import { CalendarDayProvider } from "./CalendarContext";
import type { CalendarEventResponse } from "@/server/calendar";

describe("CalendarDay", () => {
  afterEach(() => {
    cleanup();
  });

  it("renders events and overflow count", () => {
    const events: CalendarEventResponse[] = [
      {
        id: "1",
        title: "Alex's Birthday",
        date: new Date(2026, 0, 20).toISOString(),
      },
      {
        id: "2",
        title: "Family Dinner",
        date: new Date(2026, 0, 20).toISOString(),
      },
      {
        id: "3",
        title: "Roof inspection",
        date: new Date(2026, 0, 20).toISOString(),
        time: "12:00",
      },
      {
        id: "4",
        title: "Smog check",
        date: new Date(2026, 0, 20).toISOString(),
        time: "14:00",
      },
    ];

    render(
      <CalendarDayProvider
        date={new Date(2026, 0, 20)}
        isToday
        isCurrentMonth
        events={events}
      >
        <CalendarDay />
      </CalendarDayProvider>
    );

    expect(screen.getByText("20")).toBeTruthy();
    expect(screen.getByText("Alex's Birthday")).toBeTruthy();
    expect(screen.getByText("Family Dinner")).toBeTruthy();
    expect(screen.getByText(/Roof inspection/i)).toBeTruthy();
    expect(screen.getByText("+1 more")).toBeTruthy();
  });
});
