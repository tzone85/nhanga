# Rate Limiting

Fixed-window per-key limiter implemented in `src/infra/rateLimit.ts` and backed by Upstash `INCR` + `EXPIRE`.

- POST `/api/songs` and POST `/api/attempts` are limited by client IP (`x-forwarded-for` / `x-real-ip` / `"unknown"`).
- POST `/api/push/subscriptions` uses a tighter 5/min limit independently.
- Default: 20 requests per 60 seconds; override via `RATE_LIMIT_PER_MINUTE` env.

Why fixed window? Trivial state, atomic in Redis (`INCR` is atomic; `EXPIRE` runs once per window), and good enough for personal-app traffic. Sliding window or token bucket would be the next step if abuse appears.

Response on denial: `429` with the standard `apiError` envelope.
