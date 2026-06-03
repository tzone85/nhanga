# Changelog

All notable changes to Nhanga are recorded here. Format based on Keep a Changelog 1.1.0; the project follows Semantic Versioning.

## [Unreleased]

### Changed
- **Translator failures are no longer fatal.** `addSong` and `addLyrics` now catch translator errors (missing key, quota, network) and persist the song with Shona-only lines using `splitShonaLines(raw)`. The user can fill in English manually via the existing `LineEditor`. Routes return `{ data, translated, reason? }` so the UI can decide how to react.
- **`/add` and `SongEditor` surface translation failures.** A dismissible amber banner explains why translation didn't run and tells the user to fill in English by hand. Generic "Something went wrong" replaced with the actual API error message + `requestId`.
- **`LineEditor`** now has a `placeholder="English translation"` so an empty English field reads as an empty input, not a missing one.

### Added
- `splitShonaLines(raw)` pure helper in `src/domain/song.ts`. Splits on `\n` / `\r\n`, trims, drops empties.
- `AddLyricsResult` / `AddSongResult` types exposing `{ song, translated, reason? }`.
- `SongEditor` props: `initialTranslated`, `initialReason` (so SSR can pre-seed the banner if the user just landed from `/share` after a failed translation — wired in a follow-up).
- New tests: `splitShonaLines`, `addLyrics` fallback path, `addSong` fallback path, `SongEditor` banner behaviour. Suite now 107 tests, 99.68% statement coverage.

### Security
- **Push subscription SSRF hardening.** `POST /api/push/subscriptions` allowlists `endpoint` hosts against known web-push services (Mozilla autopush, FCM, Apple, Windows Notify) over HTTPS before persisting. Suffix-bypass attempts (`fcm.googleapis.com.evil.com`) rejected.
- **Known gap:** subscription endpoint still unauthenticated; rate limiting (5/min/IP) is the only barrier. Tracked in `SECURITY.md`.

### Production hardening (earlier)
- Site-wide security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy).
- Constant-time `CRON_SECRET` comparison (`src/infra/auth.cron.ts`).
- Per-IP rate limiting on POST endpoints via Upstash (`src/infra/rateLimit.ts`).
- YouTube host allowlist for share-target / ingestion (`src/infra/urlAllowlist.ts`).
- Web-push host allowlist for subscription endpoints (`src/infra/urlAllowlist.ts`).
- Structured JSON logger (`src/infra/logger.ts`) and unified API error envelope with `x-request-id` (`src/infra/apiError.ts`).
- Endpoints: `/api/health`, `/api/push/subscriptions`, `/api/songs/[id]/lyrics`.
- OSS scaffolding: LICENSE (MIT), CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG, issue + PR templates, Dependabot.
- ADRs (`docs/adr/`), runbook (`docs/runbook.md`), Obsidian vault (`docs/obsidian/`).
