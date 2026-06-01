# Application Layer

`src/application/` — orchestrates [[Domain Layer]] state through [[Ports Layer]] interfaces. Each use case is a function that takes a `deps` parameter.

Use cases:

- `addSong(input, deps)` — fetches metadata (video adapter), pulls lyrics (lyrics source), drafts translation (translator), stores the song.
- `refineLine(songId, index, patch, deps)` — loads, applies an immutable patch, stores.
- `buildQuizItems(song, dueCards)` — pure; produces a `QuizSpec` from refined lines.
- `runQuiz.finalise(input, deps)` — computes score, records the [[QuizAttempt]], reschedules [[SrsCard]]s.
- `pickWeeklySong(songs, attempts, lessonToSong)` — selects the song for the next [[Lesson]], biasing toward unseen.
- `sundayPick(deps)` — composes `pickWeeklySong` with persistence and [[Push Notifications]].

Each is unit-tested in `tests/unit/application/**` with hand-rolled fakes — never importing from `src/infra/`.
