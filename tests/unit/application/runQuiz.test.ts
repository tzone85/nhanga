import { describe, it, expect, vi } from "vitest";
import { runQuiz } from "@application/runQuiz";
import type { QuizItemResult } from "@domain/lesson";
import type { ProgressStore } from "@ports/progressStore";

describe("runQuiz.finalise", () => {
  it("computes score, records attempt, schedules each card", async () => {
    const results: QuizItemResult[] = [
      {
        cardId: "c1",
        kind: "cloze",
        correct: true,
        answeredAt: "2026-05-27T10:00:00Z",
      },
      {
        cardId: "c2",
        kind: "translate",
        correct: false,
        answeredAt: "2026-05-27T10:01:00Z",
      },
    ];
    const store = {
      recordAttempt: vi.fn().mockResolvedValue(undefined),
      listCards: vi.fn().mockResolvedValue([
        {
          id: "c1",
          kind: "line",
          ease: 2.5,
          intervalDays: 1,
          dueAt: "2026-05-27",
          lapses: 0,
        },
        {
          id: "c2",
          kind: "gloss",
          ease: 2.5,
          intervalDays: 1,
          dueAt: "2026-05-27",
          lapses: 0,
        },
      ]),
      upsertCards: vi.fn().mockResolvedValue(undefined),
    };
    const clock = { now: () => new Date("2026-05-27T10:02:00Z") };

    const out = await runQuiz.finalise(
      { lessonId: "L1", startedAt: "2026-05-27T09:50:00Z", results },
      { store: store as unknown as ProgressStore, clock, idGen: () => "att-1" },
    );

    expect(out.score).toBe(0.5);
    expect(store.recordAttempt).toHaveBeenCalled();
    const upserted = store.upsertCards.mock.calls[0]![0];
    expect(upserted).toHaveLength(2);
    expect(upserted[0].intervalDays).toBe(3); // correct → 1 * 2.5 = 3
    expect(upserted[1].intervalDays).toBe(1); // wrong → reset
  });
});
