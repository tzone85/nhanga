# Changelog

All notable changes to Nhanga are recorded here. Format based on Keep a Changelog 1.1.0; the project follows Semantic Versioning.

## [Unreleased]

### Fixed
- **Translator output now survives markdown fences.** Gemini frequently wraps JSON in ` ```json ... ``` `; the strict `JSON.parse` rejected every response and the user got "Invalid translator output: not JSON" forever. New `extractJsonObject(raw)` strips fences, finds the first balanced `{...}` object, and parses that. Six unit tests cover fences / plain / prose-wrapped / unbalanced.
- **Changed default translator model to `gemini-2.5-flash-lite`.** AI Studio keys frequently have a free-tier limit of **0** on `gemini-2.0-flash`, so the previous default failed for most users with the message "Quota exceeded ... limit: 0". `gemini-2.5-flash-lite` works on the free tier and has generous quotas. `.env.example` updated with a note listing safe alternatives.

### Changed
- Translator failures are non-fatal: `addSong` and `addLyrics` persist Shona-only lines so the user can refine English manually via `LineEditor`.
- `/api/songs` POST and `/api/songs/[id]/lyrics` PUT return `{ data, translated, reason? }` so the UI can react.
- `SongEditor` shows a dismissible amber banner with the API's `reason` when translation didn't run or any line is missing English.
- `/add` surfaces the actual API error (with `requestId`) instead of failing silently.
- `LineEditor` adds `placeholder="English translation"`.

### Added
- `splitShonaLines(raw)` pure helper in `src/domain/song.ts`.
- `extractJsonObject(raw)` helper in `src/infra/extractJson.ts`.
- `AddLyricsResult` / `AddSongResult` types exposing `{ song, translated, reason? }`.

### Security
- Push subscription SSRF hardening: `endpoint` allowlist against known web-push services (Mozilla autopush, FCM, Apple, Windows Notify). Suffix-bypass attempts rejected.
- Known gap: push subscription endpoint still unauthenticated; rate limiting (5/min/IP) is the only barrier.

### Production hardening (earlier)
- Site-wide security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy).
- Constant-time `CRON_SECRET` comparison.
- Per-IP rate limiting on POST endpoints via Upstash.
- YouTube host allowlist for share-target / ingestion.
- Structured JSON logger + unified API error envelope with `x-request-id`.
- Endpoints: `/api/health`, `/api/push/subscriptions`, `/api/songs/[id]/lyrics`.
- OSS scaffolding, ADRs, runbook, Obsidian vault.
