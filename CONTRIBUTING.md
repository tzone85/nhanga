# Contributing to Nhanga

Thanks for considering a contribution. Nhanga is a small, opinionated PWA for learning Shona through music. The project values **focus over features** — additions should serve the learning loop, not bloat it.

## Quick start

```bash
git clone https://github.com/<your-fork>/nhanga.git
cd nhanga
npm install
cp .env.example .env.local   # fill in Upstash + VAPID + AI Gateway creds
npm run dev
```

Tests:

```bash
npm run test            # unit + integration
npm run test:coverage   # enforces 80% threshold
npm run test:e2e        # Playwright
```

## Ground rules

- **TDD is mandatory.** Write a failing test before any production change. CI enforces ≥ 80% coverage.
- **Clean / Hexagonal architecture.** Domain has no imports from `infra` or `ui`. Application depends only on `domain` and `ports`. `infra` implements ports. All wiring happens in `src/composition.ts`.
- **Immutable updates.** Domain state transitions must return new objects. No in-place mutation.
- **No `console.log`** in committed code. Use `src/infra/logger.ts`.
- **Input validation at boundaries** with Zod. Domain functions trust their inputs.
- **Small files.** Aim for <400 lines; 800 is the hard ceiling.

## Branching and commits

- Branch from `main` (`feat/<slug>`, `fix/<slug>`, `docs/<slug>`).
- Conventional commits: `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`, `ci:`.
- One logical change per PR. If your diff feels like two PRs, it is two PRs.

## Pull-request checklist

- [ ] New behaviour has a failing test that now passes.
- [ ] `npm run lint`, `npm run typecheck`, `npm test` all green locally.
- [ ] Coverage threshold (80%) holds.
- [ ] Docs touched if behaviour changes (`docs/`, `README.md`, ADRs).
- [ ] No secrets, no `console.log`, no dead code.

## Reporting issues

Use [GitHub issues](https://github.com/thando-mini/nhanga/issues) with the appropriate template. For security issues, see [`SECURITY.md`](./SECURITY.md).

## Code of conduct

Participation is governed by [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).
