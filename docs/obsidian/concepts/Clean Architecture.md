# Clean Architecture

The codebase is organised around the dependency arrow rule: outer layers depend on inner layers, never the reverse.

```
Domain ← Ports ← Application ← Infra (and ← UI)
                       ↑
               Composition Root
```

- [[Domain Layer]] — pure types and invariants. Imports nothing from outside.
- [[Ports Layer]] — interfaces that the [[Application Layer]] depends on.
- [[Application Layer]] — use cases like `addSong`, `runQuiz.finalise`, `sundayPick`. Receives dependencies as parameters.
- [[Infra Layer]] — concrete adapters: `store.kv.ts`, `translator.aiGateway.ts`, `lyrics.composite.ts`, `video.youtube.ts`, `push.webpush.ts`, `clock.system.ts`, `rateLimit.ts`, `auth.cron.ts`.

All concrete adapters are wired into ports in the [[Composition Root]]. Tests substitute fakes there, never anywhere else.

See ADR 0001 in `docs/adr/0001-clean-hexagonal-architecture.md`.
