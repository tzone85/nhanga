# Infra Layer

`src/infra/` — adapters that implement ports against real services.

| File | Implements | External dependency |
|---|---|---|
| `clock.system.ts` | `Clock` | Node `Date` |
| `store.kv.ts` | `ProgressStore` | Upstash Redis |
| `translator.aiGateway.ts` | `Translator` | Vercel AI Gateway |
| `lyrics.composite.ts` | `LyricsSource` | composes `lyrics.lyricsOvh.ts` and `lyrics.genius.ts` |
| `lyrics.lyricsOvh.ts` | `LyricsSource` | api.lyrics.ovh |
| `lyrics.genius.ts` | `LyricsSource` | stub — Genius API does not return lyric text |
| `video.youtube.ts` | `VideoAdapter` | YouTube oEmbed |
| `push.webpush.ts` | `Notifier` | `web-push` library + VAPID |
| `rateLimit.ts` | (utility) | Upstash incr/expire |
| `auth.cron.ts` | (utility) | `node:crypto.timingSafeEqual` |
| `urlAllowlist.ts` | (utility) | URL parser |
| `apiError.ts`, `logger.ts` | (utility) | stdout / stderr JSON |

Each adapter is integration-tested in `tests/integration/**` with MSW or hand-rolled fakes.
