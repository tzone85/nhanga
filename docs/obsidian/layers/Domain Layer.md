# Domain Layer

`src/domain/` — pure types and invariants. **No imports outside this folder.**

Files:

- `ids.ts` — branded `Id` type, ULID generator, regex validator.
- `song.ts` — `Song`, `Line`, `Gloss`, immutable `refineLine`.
- `lesson.ts` — `Lesson`, `QuizAttempt`, ISO-week helpers, `computeScore`.
- `srs.ts` — `SrsCard`, `schedule(card, grade, now)`.
- `quiz.ts` — `makeCloze`, `gradeTranslate` (Levenshtein ≤ 2), `splitMorphemes`.

Why this matters: the entire learning logic — what counts as a passing quiz, how cards age, how lyrics are masked into cloze items — is testable with no IO, no env, no Vercel.

Sibling layers: [[Application Layer]], [[Ports Layer]], [[Infra Layer]].
