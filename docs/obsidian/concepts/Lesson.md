# Lesson

A `Lesson` is the weekly pairing of a [[Song]] with a quiz target.

```ts
interface Lesson {
  id: string;
  songId: string;
  weekIso: string;        // e.g. "2026-W22"
  createdAt: string;
  passScore: number;      // default 0.8
}
```

Lessons are created by the [[Sunday Pick]] use case. The quiz at `/quiz/[lessonId]` materialises items from the song lines and current [[SrsCard]]s.
