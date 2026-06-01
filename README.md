# Nhanga

> One song a week. Sunday quiz. Built to remember.

A small, opinionated PWA for learning [Shona](https://en.wikipedia.org/wiki/Shona_language) through music.
Curated weekly song · spaced-repetition quiz on Sundays · iOS share-sheet ingestion from YouTube.

[![CI](https://github.com/thando-mini/nhanga/actions/workflows/ci.yml/badge.svg)](https://github.com/thando-mini/nhanga/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)
[![Coverage ≥ 80%](https://img.shields.io/badge/coverage-%E2%89%A580%25-brightgreen)](./vitest.config.ts)

## Why

Most language apps drown you in cards. Music doesn't — a chorus sticks because you sang it. Nhanga picks one song a week, lets you refine the translation as you learn, and quizzes you on Sunday using spaced repetition over the lines you've actually heard.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **Tailwind v4**
- **TypeScript** in strict mode (`exactOptionalPropertyTypes`, `noUncheckedIndexedAccess`)
- **Clean / Hexagonal architecture** — see [`docs/adr/0001-clean-hexagonal-architecture.md`](./docs/adr/0001-clean-hexagonal-architecture.md)
- **Upstash Redis** for state (songs, lessons, attempts, SRS cards, push subs)
- **Vercel AI Gateway** for translation (provider/model string; no provider-specific SDK)
- **Web Push** with VAPID for Sunday notifications
- **Vercel Cron** to schedule the Sunday pick
- **Vitest** + **MSW** for unit/integration, **Playwright** for E2E

## Get running

```bash
git clone https://github.com/thando-mini/nhanga.git
cd nhanga
npm install
cp .env.example .env.local
# generate VAPID keys
npx web-push generate-vapid-keys
npm run dev
```

`.env.local` needs values for Upstash, VAPID, `CRON_SECRET`, and (optionally) `AI_TRANSLATOR_MODEL`. See [`.env.example`](./.env.example).

## Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Local dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Run the built app |
| `npm run lint` | ESLint (Next.js + TS rules) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Unit + integration via Vitest |
| `npm run test:unit` | Unit tests only |
| `npm run test:integration` | Integration tests only |
| `npm run test:coverage` | Coverage report (80% threshold enforced) |
| `npm run test:e2e` | Playwright E2E |
| `npm run seed` | Seed the library from `seed/songs.json` |

## Architecture in 30 seconds

```
app/            Next.js routes (delivery mechanism)
src/
  domain/       Pure types + invariants; zero IO
  ports/        Interfaces only
  application/  Use cases over ports
  infra/        Concrete adapters (Upstash, AI Gateway, YouTube, Web Push, ...)
  composition.ts  The ONLY wiring point. Tests substitute fakes.
```

Read [`docs/obsidian/Home.md`](./docs/obsidian/Home.md) — the docs are a small Obsidian vault. ADRs explain the load-bearing decisions; the runbook tells you what to do when things break in production.

## API surface

| Route | Method | Purpose |
|---|---|---|
| `/api/health` | GET | Liveness probe |
| `/api/songs` | GET / POST | List songs / ingest a new one (rate-limited, YouTube allowlist) |
| `/api/songs/[id]` | GET / PATCH | Read a song / refine a line |
| `/api/attempts` | POST | Submit a quiz attempt (rate-limited) |
| `/api/push/subscriptions` | POST | Register a Web Push subscription |
| `/api/cron/sunday-pick` | GET | Vercel Cron only — Bearer `CRON_SECRET` |

All errors share the same envelope: `{ error, code, requestId }` with `x-request-id` in headers.

## Production checklist

- All POST endpoints rate-limited per IP via Upstash.
- `CRON_SECRET` compared in constant time.
- Site-wide CSP, HSTS, `X-Frame-Options: DENY`, `frame-ancestors 'none'`, restrictive `Permissions-Policy`.
- Share-target accepts YouTube hosts only.
- Structured JSON logging; no `console.log` in committed code (enforced).
- 80% test coverage gate in CI; Playwright E2E on `main`.

See [`SECURITY.md`](./SECURITY.md) and [`docs/runbook.md`](./docs/runbook.md).

## Contributing

This repo is **open source under MIT**. PRs welcome — please read [`CONTRIBUTING.md`](./CONTRIBUTING.md) first. The project keeps a focused scope (the weekly-song / Sunday-quiz loop). Big additions belong in a fork.

## License

[MIT](./LICENSE). The seed song lyrics in `seed/songs.json` are excerpts for educational use; copyrights remain with their respective owners.
