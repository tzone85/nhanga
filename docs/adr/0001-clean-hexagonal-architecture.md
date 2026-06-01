# ADR 0001 — Clean / Hexagonal Architecture

**Status:** Accepted
**Date:** 2026-05-27

## Context

Nhanga has four independent integrations (Upstash, AI Gateway, YouTube oEmbed, Web Push) and a domain model (Song, Lesson, QuizAttempt, SrsCard) that should be testable without any of them. A long-running personal project also collects accidental coupling fast unless layering is enforced from day one.

## Decision

Adopt clean / hexagonal architecture with four layers and one wiring point:

- `src/domain/**` — pure data + invariants. No imports outside `domain`.
- `src/ports/**` — interfaces only (`ProgressStore`, `Translator`, `Notifier`, `LyricsSource`, `VideoAdapter`, `Clock`).
- `src/application/**` — use cases. Depends on `domain` + `ports`. Receives deps as parameters.
- `src/infra/**` — adapters implementing ports (Upstash KV, AI Gateway translator, YouTube oEmbed, lyrics.ovh, system clock, web-push notifier, rate limiter, logger).
- `src/composition.ts` — the **only** place where concrete adapters meet ports. Tests substitute fakes here, never anywhere else.

## Consequences

- Tests for the domain and application layers run with no IO, no env vars, no mocks-of-our-own-code.
- The Next.js `app/` directory is a delivery mechanism — it imports use cases from `application/` and calls `compose()` once per request.
- New integrations cost: define a port, write the adapter, wire in composition. No domain code changes.
- Trade-off: small overhead vs. a single-file Next.js route. Worth it once the second integration shows up — which it already has.

## Verified by

- `tests/unit/domain/**` runs without `infra/` ever loading.
- `mempalace.yaml` enforces the room boundaries.
