import { AssistantChat, recentHistory } from "@/components/features/assistant/AssistantChat";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { sendAssistantMessageAction } = vi.hoisted(() => ({
  sendAssistantMessageAction: vi.fn(),
}));
vi.mock("@/lib/actions/assistant.action", () => ({ sendAssistantMessageAction }));

const type = (text: string) =>
  fireEvent.change(screen.getByRole("textbox", { name: "Message" }), {
    target: { value: text },
  });

describe("AssistantChat", () => {
  beforeEach(() => {
    sendAssistantMessageAction.mockReset();
  });

  it("sends the history with the job id and shows the reply", async () => {
    sendAssistantMessageAction.mockResolvedValue({
      success: true,
      data: { reply: "Start with TypeScript.", source: "ai" },
    });
    render(<AssistantChat jobId="job-001" />);

    type("What should I learn?");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
    });

    expect(sendAssistantMessageAction).toHaveBeenCalledWith(
      [{ role: "user", content: "What should I learn?" }],
      "job-001",
    );
    expect(await screen.findByText("Start with TypeScript.")).toBeTruthy();
    expect(screen.queryByText(/Rule-based answer/)).toBeNull();
  });

  it("labels fallback answers so nobody mistakes them for AI", async () => {
    sendAssistantMessageAction.mockResolvedValue({
      success: true,
      data: { reply: "Summary from your profile.", source: "fallback" },
    });
    render(<AssistantChat />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Which skills should I learn next?" }));
    });

    expect(await screen.findByText("Summary from your profile.")).toBeTruthy();
    expect(screen.getByText(/Rule-based answer/)).toBeTruthy();
  });

  it("keeps the message to retry when sending fails", async () => {
    sendAssistantMessageAction.mockResolvedValue({
      success: false,
      message: "Too many requests",
      code: "THROTTLED",
    });
    render(<AssistantChat />);

    type("Hello");
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Send" }));
    });

    expect(screen.getByText("Too many requests")).toBeTruthy();
    expect(screen.getByRole("textbox", { name: "Message" })).toHaveProperty("value", "Hello");
  });
});

describe("recentHistory", () => {
  it("keeps only the latest messages within 20 messages and 20,000 characters", () => {
    const long = Array.from({ length: 30 }, (_, i) => ({
      role: (i % 2 ? "assistant" : "user") as "user" | "assistant",
      content: `m${i}`,
    }));
    const kept = recentHistory(long);
    expect(kept).toHaveLength(20);
    expect(kept.at(-1)?.content).toBe("m29");

    const big = [
      { role: "user" as const, content: "a".repeat(15_000) },
      { role: "assistant" as const, content: "b".repeat(4_000) },
      { role: "user" as const, content: "c".repeat(2_000) },
    ];
    expect(recentHistory(big).map((m) => m.content[0])).toEqual(["b", "c"]);
  });
});
