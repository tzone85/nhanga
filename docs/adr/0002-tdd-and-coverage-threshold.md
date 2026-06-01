# ADR 0002 — TDD as the default, 80% coverage enforced in CI

**Status:** Accepted
**Date:** 2026-05-27

## Context

Solo and small-team projects drift fastest when tests become a back-fill activity. Coverage without TDD measures the wrong thing; TDD without a coverage gate is easy to skip on a tired Friday.

## Decision

- Every behavioural change starts with a failing test in `tests/unit/**` or `tests/integration/**`.
- Vitest enforces 80% lines / functions / branches / statements on `src/**`, configured in `vitest.config.ts`.
- E2E (`tests/e2e/**`) is excluded from the unit/integration runner and the coverage report — it covers user flow, not code coverage.
- CI runs lint, typecheck, unit, integration, and build on every push and PR. E2E runs on `main`.

## Consequences

- Pull requests that drop coverage fail CI. Any drop is intentional and visible in the diff.
- The domain layer trends to nearly 100% naturally because it is pure. The infra layer is allowed to lag if a useful integration test exists.
- Files that are purely glue (e.g. `RegisterServiceWorker.tsx`) are excluded from coverage explicitly with reasoning in `vitest.config.ts`.
