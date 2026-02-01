import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ChatPage } from "./index";

const sendMessageMock = vi.fn();

vi.mock("@tanstack/ai-react", () => ({
  useChat: () => ({
    messages: [
      {
        id: "msg-1",
        role: "assistant",
        parts: [{ type: "text", content: "Agent received: Hello" }],
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

    expect(await screen.findByText(/agent received/i)).toBeTruthy();
    expect(sendMessageMock).toHaveBeenCalledWith("Hello");
  });
});
