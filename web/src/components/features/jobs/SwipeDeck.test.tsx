import SwipeDeck from "@/components/features/jobs/SwipeDeck";
import type { DiscoverJob, SwipeResult } from "@/lib/api/api.type";
import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { swipeAction } = vi.hoisted(() => ({ swipeAction: vi.fn() }));
vi.mock("@/lib/actions/jobs.action", () => ({
  swipeAction,
  resetSwipesAction: vi.fn(),
}));

const job = (id: string, title: string): DiscoverJob => ({
  id,
  title,
  company: "Demo Co (demo)",
  location: "Bangkok",
  workArrangement: "HYBRID",
  employmentType: "FULL_TIME",
  salaryMin: 30000,
  salaryMax: 40000,
  description: "",
  isDemo: true,
  skills: [{ id: "react", name: "React", required: true }],
  match: {
    score: 80,
    matchedSkillIds: ["react"],
    missingSkillIds: [],
    unconfirmedSkillIds: [],
  },
});

const jobs = [job("job-1", "Frontend Developer"), job("job-2", "Data Analyst")];

const swipeResult = (overrides: Partial<SwipeResult> = {}): SwipeResult => ({
  ...createSwipeResult(),
  ...overrides,
});

function createSwipeResult(): SwipeResult {
  return {
    jobId: "job-1",
    direction: "LIKE" as const,
    matchCreated: false,
    isMatched: false,
    matchId: null,
    application: { id: "application-1", status: "INTERESTED" as const },
  };
}

const heading = (name: string) => screen.queryByRole("heading", { name });

describe("SwipeDeck", () => {
  beforeEach(() => {
    swipeAction.mockReset();
    swipeAction.mockResolvedValue(swipeResult());
  });

  it("shows the best match first with its score and a demo label", () => {
    render(<SwipeDeck jobs={jobs} />);

    expect(heading("Frontend Developer")).toBeInTheDocument();
    expect(screen.getByLabelText(/Profile fit 80 out of 100/)).toBeInTheDocument();
    expect(screen.getByText("Demo data")).toBeInTheDocument();
  });

  it("likes with the Like button and moves to the next card", async () => {
    render(<SwipeDeck jobs={jobs} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Like/ }));
    });

    expect(swipeAction).toHaveBeenCalledWith("job-1", "LIKE");
    expect(heading("Frontend Developer")).not.toBeInTheDocument();
    expect(heading("Data Analyst")).toBeInTheDocument();
  });

  it("supports the keyboard: left arrow skips", async () => {
    render(<SwipeDeck jobs={jobs} />);

    await act(async () => {
      fireEvent.keyDown(screen.getByRole("region", { name: /Job cards/ }), {
        key: "ArrowLeft",
      });
    });

    expect(swipeAction).toHaveBeenCalledWith("job-1", "SKIP");
  });

  it("puts the card back and explains when saving fails", async () => {
    swipeAction.mockResolvedValue({
      success: false,
      message: "Server unavailable",
      code: "API_ERROR",
    });
    render(<SwipeDeck jobs={jobs} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Pass/ }));
    });

    expect(heading("Frontend Developer")).toBeInTheDocument();
    expect(screen.getByText(/Server unavailable/)).toBeInTheDocument();
  });

  it("opens the match modal only when the backend creates a new match", async () => {
    swipeAction.mockResolvedValue(
      swipeResult({
        isMatched: true,
        matchCreated: true,
        matchId: "match-1",
      }),
    );
    render(<SwipeDeck jobs={jobs} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Like/ }));
    });

    expect(screen.getByRole("dialog")).toHaveAttribute("data-match-id", "match-1");
  });

  it("does not replay the celebration for an existing backend match", async () => {
    swipeAction.mockResolvedValue(
      swipeResult({
        isMatched: true,
        matchId: "match-existing",
      }),
    );
    render(<SwipeDeck jobs={jobs} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: /Like/ }));
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows an empty state when every job has been swiped", () => {
    render(<SwipeDeck jobs={[]} />);

    expect(screen.getByText(/seen every job/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Start over/ })).toBeInTheDocument();
  });
});
