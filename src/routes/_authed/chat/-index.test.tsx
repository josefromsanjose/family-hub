import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatPage } from "./-components/chat-page";

const sendMessageMock = vi.fn();

vi.mock("@tanstack/ai-react", () => ({
  useChat: () => ({
    messages: [
      {
        id: "msg-1",
        role: "assistant",
        parts: [{ type: "text", content: "**Hello** from the agent" }],
      },
    ],
    sendMessage: sendMessageMock,
    isLoading: false,
    error: undefined,
  }),
  fetchServerSentEvents: vi.fn(),
}));

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("ChatPage", () => {
  it("sends input and renders the agent response", async () => {
    render(<ChatPage />);

    fireEvent.change(screen.getByPlaceholderText(/ask the agent/i), {
      target: { value: "Hello" },
    });
    fireEvent.click(screen.getByRole("button", { name: /send/i }));

    const strongText = await screen.findByText("Hello");
    expect(strongText.tagName).toBe("STRONG");
    expect(sendMessageMock).toHaveBeenCalledWith("Hello");
  });
});
