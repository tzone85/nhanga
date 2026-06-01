# Security Policy

## Supported versions

Nhanga is on a rolling-release model. Only the `main` branch and the latest production deploy receive security fixes.

## Reporting a vulnerability

**Do not** open a public GitHub issue for security problems.

Email the maintainer at `thando.mini@sanlam.co.za` with:

- A description of the issue and its impact.
- Reproduction steps or proof of concept.
- Affected commit / deploy URL if known.
- Whether you would like to be credited in the fix commit / changelog.

Acknowledgement target: within 48 hours.
Fix target: 14 days for high severity, 30 days for everything else.

## Scope

In-scope:

- API routes under `app/api/**`
- Authentication / authorisation logic (`src/infra/auth.cron.ts`, `src/infra/rateLimit.ts`)
- Composition root and env handling (`src/composition.ts`)
- Service worker (`public/sw.js`)
- Anything that touches user data in Upstash

Out of scope:

- Issues that require physical access to a user's device beyond standard browser sandboxing.
- Third-party services (Upstash, Vercel AI Gateway, YouTube, lyrics.ovh) — report those upstream.

## Known posture

- All API responses include an `x-request-id` to aid investigation.
- `CRON_SECRET` is compared in constant time; rejected if shorter than 16 bytes.
- POST endpoints are rate-limited per IP via Upstash.
- Strict CSP, HSTS, frame-ancestors `'none'`, and other headers applied site-wide.
- Only YouTube hosts are accepted for share-target / ingestion URLs.
- Push subscription endpoints are allowlisted against known web-push services (Mozilla autopush, FCM, Apple, Windows Notify) over HTTPS. SSRF via `webpush.sendNotification` is mitigated at write time.

## Known gaps (tracked)

- **No user accounts.** `POST /api/push/subscriptions` is anonymous; rate limiting is the only barrier between an attacker and the broadcast set. Auth (likely Sign in with Vercel) is the next planned addition.
- **No subscription revocation endpoint.** Stale or expired endpoints linger until `web-push` returns 410 Gone; we don't yet remove them on failure.
- **CI E2E does not hit a real Upstash.** Share-target and Sunday-quiz Playwright specs are skipped without Upstash creds; integration of fixture state into CI is a follow-up.
