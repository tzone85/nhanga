import { computeScore, type QuizAttempt, type QuizItemResult } from "@domain/lesson";
import { schedule } from "@domain/srs";
import type { ProgressStore } from "@ports/progressStore";
import type { Clock } from "@ports/clock";

export interface RunQuizDeps {
  readonly store: ProgressStore;
  readonly clock: Clock;
  readonly idGen: () => string;
}

export interface FinaliseInput {
  readonly lessonId: string;
  readonly startedAt: string;
  readonly results: readonly QuizItemResult[];
}

export const runQuiz = {
  async finalise(input: FinaliseInput, deps: RunQuizDeps): Promise<QuizAttempt> {
    const now = deps.clock.now();
    const score = computeScore(input.results.map(r => r.correct));
    const attempt: QuizAttempt = {
      id: deps.idGen(),
      lessonId: input.lessonId,
      startedAt: input.startedAt,
      finishedAt: now.toISOString(),
      items: input.results,
      score
    };
    await deps.store.recordAttempt(attempt);

    const cards = await deps.store.listCards();
    const byId = new Map(cards.map(c => [c.id, c]));
    const updated = input.results
      .map(r => {
        const c = byId.get(r.cardId);
        return c ? schedule(c, r.correct ? "correct" : "wrong", now) : null;
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);

    await deps.store.upsertCards(updated);
    return attempt;
  }
};
