# Nhanga — agent instructions

Next.js 16 + React 19 + Tailwind v4. Some APIs and conventions differ from older docs. When in doubt, consult `node_modules/next/dist/docs/` and heed deprecation notices.

Architecture: Clean/Hexagonal. Domain → Ports ← Application; Infra implements Ports. Composition root in `src/composition.ts` is the only wiring point. Tests replace it with fakes.

TDD is mandatory. Write failing tests first. Coverage threshold 80% (enforced in CI).

No mutation. All domain state transitions return new objects. No `console.log` in committed code.
