# Song

A `Song` is an immutable record of a track plus its lyric lines.

```ts
interface Song {
  id: string;
  title: string;
  artist: string;
  youtubeUrl?: string;
  lines: readonly Line[];
  addedAt: string;
  lastQuizzedAt?: string;
}
```

Each line carries Shona text, an English translation, optional morpheme glosses, and a `confidence: "draft" | "refined"` flag. The translator output starts as `"draft"`; the user upgrades lines to `"refined"` via `refineLine` (which returns a new song — see immutability rule in `AGENTS.md`).

Used by [[Lesson]] (via `Lesson.songId`), [[QuizAttempt]] indirectly through `Lesson`, and the `buildQuizItems` use case in the [[Application Layer]].
