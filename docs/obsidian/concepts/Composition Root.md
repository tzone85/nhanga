# Composition Root

`src/composition.ts` is the only file where concrete adapters touch ports. It exports `compose()`, which returns a struct of:

- `store` — [[Ports Layer]] `ProgressStore` implemented by Upstash KV
- `translator` — `Translator` via Vercel AI Gateway
- `lyrics` — composite source (Genius stub → lyrics.ovh)
- `video` — YouTube oEmbed
- `notifier` — Web Push notifier
- `clock` — system clock
- `idGen` — ULID generator
- `rateLimit` — fixed-window per-key rate limiter backed by Upstash

If any required env var is missing, the first call to `compose()` throws fail-fast at request time — there is no quiet fallback.

Why one root? Because:

- Tests don't need to know how the adapters are constructed; they import use cases and pass fakes that satisfy the port interfaces.
- Migration cost for changing a provider (e.g. swap Upstash → Postgres) is one file.
- It makes the "all the env vars" surface a single, greppable target.

See [[Clean Architecture]] and [[Hexagonal Layers]].
