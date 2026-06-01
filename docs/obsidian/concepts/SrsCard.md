# SrsCard

A spaced-repetition card. The SRS algorithm is intentionally tiny — ease in [1.3, 3.0], 0.10 up on correct, 0.20 down on wrong, lapses tracked separately.

```ts
interface SrsCard {
  id: string;
  kind: "line" | "gloss";
  ease: number;
  intervalDays: number;
  dueAt: string;
  lapses: number;
}
```

`schedule(card, grade, now)` returns a new card (immutable update). Used by `runQuiz.finalise` to update cards after each [[QuizAttempt]].
