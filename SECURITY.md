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
- `CRON_SECRET` is compared in constant time.
- POST endpoints are rate-limited per IP via Upstash.
- Strict CSP, HSTS, frame-ancestors `'none'`, and other headers applied site-wide.
- Only YouTube hosts are accepted for share-target / ingestion URLs.
