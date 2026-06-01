# Sunday Pick

Every Sunday at 07:00 UTC, Vercel Cron hits `GET /api/cron/sunday-pick` with `Authorization: Bearer ${CRON_SECRET}`.

Flow:

1. The handler constant-time-verifies the bearer via `isAuthorisedCron`.
2. `sundayPick(deps)` loads all [[Song]]s, [[QuizAttempt]]s, [[Lesson]]s.
3. `pickWeeklySong` chooses the next song: unseen songs first (oldest `addedAt` wins ties), else the song with the lowest historical score.
4. A new [[Lesson]] is created with `weekIso = current ISO week`.
5. The notifier sends a Web Push notification linking to `/quiz/<lesson.id>`.
6. The response returns the lesson for traceability.

Failure modes: see `docs/runbook.md` § "Cron didn't run on Sunday".

Related: [[Push Notifications]], [[Security Posture]].
