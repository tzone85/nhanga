# Security Posture

What's protected, by what, and why.

| Surface | Control | Code |
|---|---|---|
| Cron endpoint | Constant-time Bearer comparison; rejects if secret < 16 chars | `src/infra/auth.cron.ts` |
| POST endpoints | Per-IP fixed-window rate limit | `src/infra/rateLimit.ts` |
| Ingestion URLs | YouTube host allowlist | `src/infra/urlAllowlist.ts` |
| API responses | Structured envelope with `x-request-id`; never echoes internals | `src/infra/apiError.ts` |
| Service worker | CSP `worker-src 'self'`; cache GET-only same-origin | `next.config.ts`, `public/sw.js` |
| Site headers | CSP, HSTS, X-Frame-Options DENY, frame-ancestors `'none'`, Permissions-Policy denies camera/mic/geo | `next.config.ts` |
| Env vars | Fail-fast via `requireEnv` | `src/composition.ts` |
| Push subscriptions | Zod-validated; VAPID-signed delivery | `app/api/push/subscriptions/route.ts`, `src/infra/push.webpush.ts` |

See [[Sunday Pick]], [[Share Target]], [[Push Notifications]], [[Rate Limiting]] for the operational view.
