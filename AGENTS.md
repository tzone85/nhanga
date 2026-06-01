# Nhanga — agent instructions

Next.js 16 + React 19 + Tailwind v4 + TypeScript strict. Some APIs and conventions differ from older docs. When in doubt, consult `node_modules/next/dist/docs/` and heed deprecation notices.

## Architecture (load-bearing)

Clean / Hexagonal — four layers + one wiring point. **Do not import across the arrows:**

```
domain  ←  ports  ←  application  ←  infra
                                     ↑
                              composition.ts
```

- `src/domain/**` — pure types and invariants. **No imports outside `domain`.**
- `src/ports/**` — interfaces only. No implementations.
- `src/application/**` — use cases over ports. Takes `deps` parameters.
- `src/infra/**` — adapters implementing ports against real services.
- `src/composition.ts` — **the only place** concrete adapters touch ports. Tests substitute fakes here, not anywhere else.
- `app/**` — Next.js delivery. Calls `compose()` per request.

If your change requires `infra/` to import from `application/`, you're inverting the arrow — rethink it.

## Rules (non-negotiable)

- **TDD.** Write a failing test in `tests/unit/**` or `tests/integration/**` before changing production code. Coverage gate is 80% in CI.
- **Immutability.** Domain state transitions return new objects. Never mutate.
- **No `console.log`.** Use `src/infra/logger.ts`.
- **Validate at boundaries** with Zod. Domain trusts its inputs.
- **One use case = one file** in `application/`.
- **Tests for `application/` may not import from `infra/`** — pass fakes that implement the port.

## API conventions

All routes return either `{ data, ... }` on success or the standard error envelope from `src/infra/apiError.ts`:

```ts
{ error: string, code: string, requestId: string }
```

with `x-request-id` in headers. Unexpected exceptions go through `handleUnexpected(err, route)`.

POST endpoints are rate-limited per IP via `deps.rateLimit(...)` from the composition root. The cron endpoint authenticates via `isAuthorisedCron` (constant-time Bearer compare).

## When making changes

1. Read the relevant ADR under `docs/adr/` if your change touches an architectural decision.
2. Write the failing test.
3. Implement minimally.
4. Run `npm run lint && npm run typecheck && npm test`.
5. Update `CHANGELOG.md` under `[Unreleased]`.
6. If behaviour changed, update `docs/obsidian/` and the runbook.

## Where to find what

- Use cases: `src/application/`
- Adapters: `src/infra/`
- Routes: `app/api/`
- Pages: `app/`
- ADRs: `docs/adr/`
- Runbook: `docs/runbook.md`
- Architecture vault: `docs/obsidian/`
- Specs / diagrams: `docs/superpowers/`
