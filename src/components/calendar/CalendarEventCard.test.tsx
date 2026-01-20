import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { CalendarEventCard } from "./CalendarEventCard"

describe("CalendarEventCard", () => {
  afterEach(() => {
    cleanup()
  })

  it("renders event details and triggers delete", () => {
    const onDelete = vi.fn()

    render(
      <CalendarEventCard
        title="Piano Lesson"
        description="Bring sheet music"
        time="16:00"
        participantLabel="Ava"
        onDelete={onDelete}
      />
    )

    expect(screen.getByText("Piano Lesson")).toBeTruthy()
    expect(screen.getByText(/for ava/i)).toBeTruthy()

    fireEvent.click(screen.getByRole("button", { name: /delete event/i }))
    expect(onDelete).toHaveBeenCalledTimes(1)
  })

  it("renders compact layout without delete action", () => {
    render(
      <CalendarEventCard
        title="Family Dinner"
        time="18:30"
        dateLabel="Jan 23"
        compact
      />
    )

    expect(screen.getByText("Family Dinner")).toBeTruthy()
    expect(screen.getByText(/Jan 23/)).toBeTruthy()
    expect(
      screen.queryByRole("button", { name: /delete event/i })
    ).toBeNull()
  })
})
