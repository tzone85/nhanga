# QuizAttempt

A `QuizAttempt` is the immutable record of one quiz session.

```ts
interface QuizAttempt {
  id: string;
  lessonId: string;       // FK to Lesson
  startedAt: string;
  finishedAt?: string;
  items: readonly QuizItemResult[];
  score?: number;         // 0..1
}
```

Created by `runQuiz.finalise` in the [[Application Layer]]. The use case also schedules [[SrsCard]]s based on per-item correctness.

`pickWeeklySong` uses the set of attempts to detect which songs have been seen, biasing the next selection toward unseen songs.
