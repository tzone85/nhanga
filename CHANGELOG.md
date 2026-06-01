# Changelog

All notable changes to Nhanga are recorded here. Format based on Keep a Changelog 1.1.0; the project follows Semantic Versioning.

## [Unreleased]

### Added
- Production hardening: site-wide security headers (CSP, HSTS, X-Frame-Options, Referrer-Policy, Permissions-Policy).
- Constant-time `CRON_SECRET` comparison (`src/infra/auth.cron.ts`).
- Per-IP rate limiting on POST endpoints via Upstash (`src/infra/rateLimit.ts`).
- YouTube host allowlist for share-target / ingestion (`src/infra/urlAllowlist.ts`).
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
