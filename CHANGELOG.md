# Changelog

All notable changes to Nhanga are recorded here. Format based on Keep a Changelog 1.1.0; the project follows Semantic Versioning.

## [Unreleased]

### Fixed
- **CSP `eval()` error in development.** Added `'unsafe-eval'` to `script-src` only when `NODE_ENV === "development"` so React 19 debugging features work under Turbopack. Production CSP is unchanged.

### Added
- **Paste-lyrics fallback.** When automatic lyrics fetching fails, the song page now shows a paste form so users can add Shona lyrics manually. New use case `addLyrics`, API route `PUT /api/songs/[id]/lyrics`, and empty-state UI in `SongEditor`.

### Changed
- **Home page onboarding.** Replaced the blank landing page with a "How it works" explainer and navigation links to "Add a song" and "Browse library" so new users can discover the app flow.

### Security
- **Push subscription SSRF hardening.** `POST /api/push/subscriptions` now allowlists `endpoint` hosts against known web-push services (Mozilla autopush, FCM, Apple, Windows Notify) over HTTPS before persisting. Without this, a stored endpoint pointed at `http://169.254.169.254/...` (or any internal host) would be re-fetched by `webpush.sendNotification` on every Sunday cron — turning the push fan-out into a weekly SSRF oracle.
- Suffix-bypass attempts (e.g. `fcm.googleapis.com.evil.com`) are rejected by exact-host or `.suffix` match, not naive `endsWith`.
- **Known gap:** the subscription endpoint is still unauthenticated. Today only rate-limiting (5/min/IP) stands between an anonymous attacker and the broadcast set. Auth is tracked for the next iteration; see `SECURITY.md`.

### Added
- Production hardening: site-wide security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy).
- Constant-time `CRON_SECRET` comparison (`src/infra/auth.cron.ts`).
- Per-IP rate limiting on POST endpoints via Upstash (`src/infra/rateLimit.ts`).
- YouTube host allowlist for share-target / ingestion (`src/infra/urlAllowlist.ts`).
- Web-push host allowlist for subscription endpoints (`src/infra/urlAllowlist.ts`).
- Structured JSON logger (`src/infra/logger.ts`) and unified API error responses with `x-request-id` (`src/infra/apiError.ts`).
- Push subscription endpoint (`/api/push/subscriptions`).
- Health endpoint (`/api/health`).
- OSS scaffolding: LICENSE (MIT), CONTRIBUTING, CODE_OF_CONDUCT, SECURITY, CHANGELOG, issue + PR templates, Dependabot.
- Architecture Decision Records under `docs/adr/`.
- Operations runbook under `docs/runbook.md`.
- Obsidian-compatible docs vault under `docs/obsidian/`.

### Changed
- API routes now use structured error envelopes and never leak internals.
- `share` page validates URLs against the YouTube allowlist before ingesting.
- Vitest coverage no longer attempts to run Playwright specs.
