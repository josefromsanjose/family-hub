import { render, screen, fireEvent } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { AvatarCard } from "./AvatarCard";

describe("AvatarCard", () => {
  it("calls onSelect when pressed", () => {
    const onSelect = vi.fn();
    render(
      <AvatarCard
        name="Emma"
        color="bg-blue-500"
        selected={false}
        onSelect={onSelect}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: /select emma/i }));
    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it("marks the button as pressed when selected", () => {
    render(
      <AvatarCard
        name="Emma"
        color="bg-blue-500"
        selected
        onSelect={() => {}}
      />
    );

    const button = screen.getByRole("button", { name: /select emma/i });
    expect(button.getAttribute("aria-pressed")).toBe("true");
  });
});
