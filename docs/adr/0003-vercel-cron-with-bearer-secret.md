# ADR 0003 — Vercel Cron with constant-time Bearer secret

**Status:** Accepted
**Date:** 2026-05-27

## Context

The Sunday quiz is selected by a scheduled job that mutates state (creates a Lesson, sends Web Push). The endpoint must be reachable only by Vercel Cron, not by the open internet — otherwise anyone can force a re-pick or notification storm.

## Decision

- `vercel.json` registers `crons[]` with path `/api/cron/sunday-pick` and `schedule: "0 7 * * 0"` (07:00 UTC Sundays).
- Vercel Cron sends `Authorization: Bearer ${CRON_SECRET}`. The route compares it to `process.env.CRON_SECRET` in **constant time** via `node:crypto`.timingSafeEqual, refusing the request if either side is missing or the secret is shorter than 16 chars.
- The endpoint returns the created `Lesson` for traceability but does not echo secrets.

## Consequences

- `CRON_SECRET` is the only credential separating the world from a forced re-pick. Treat its rotation as a security event (see `docs/runbook.md`).
- A timing-based oracle attack against the bearer comparison is infeasible — the comparator returns in constant time on equal-length inputs and short-circuits on length mismatch only after `Buffer.from`, which is itself constant-time for this size.
- If Vercel Cron is ever migrated off the platform, this contract (Bearer header, single secret, GET-only) makes the migration straightforward.
