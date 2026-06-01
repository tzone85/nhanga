# Nhanga — Operations Runbook

## Topology

- **Hosting:** Vercel (Fluid Compute, Node.js runtime).
- **State:** Upstash Redis (single region, replicated).
- **AI:** Vercel AI Gateway → model string `anthropic/claude-sonnet-4-6` by default.
- **Notifications:** Web Push via `web-push` with VAPID.
- **Cron:** Vercel Cron hits `GET /api/cron/sunday-pick` every Sunday at 07:00 UTC. See `vercel.json`.

## First-time deploy

1. `gh repo create` → push.
2. Connect repo on Vercel.
3. `vercel link`.
4. Generate VAPID keys: `npx web-push generate-vapid-keys`.
5. `vercel env add` each variable in `.env.example`. The `CRON_SECRET` must be a strong random string (≥ 32 bytes); Vercel Cron will send it automatically as `Authorization: Bearer ...`.
6. `npm run seed` against production once to populate the library (set `UPSTASH_REDIS_REST_*` locally and run).
7. Push `main`. CI verifies; Vercel deploys.

## Required environment variables

See `.env.example`. Missing variables surface as `Missing env var: NAME` from `requireEnv` in the composition root — fail-fast at first request.

## Day-to-day

- **Add a song manually:** `/add` page → paste YouTube URL or pasted lyrics.
- **Inspect a quiz attempt:** logs go to Vercel as JSON; filter by `event=api.error` or `event=api.unexpected` and grep by `requestId`.
- **Rotate `CRON_SECRET`:** update Vercel env, redeploy. The constant-time comparator rejects all in-flight requests with the old value as soon as the deploy promotes.

## Incident playbook

### "Cron didn't run on Sunday"

1. Check Vercel → Project → Cron Jobs → `sunday-pick` for the most recent invocation status.
2. If the invocation returned 401: `CRON_SECRET` mismatch. Re-set on Vercel; redeploy.
3. If it returned 5xx: search logs for `event=api.unexpected route=cron.sunday-pick` and the associated `requestId`.
4. Manual trigger: `curl -H "Authorization: Bearer $CRON_SECRET" https://nhanga.example.com/api/cron/sunday-pick`.

### "Translator output broken"

1. The translator validates output shape via Zod. Failures throw `invalid translator output: ...`. Look for `event=api.unexpected` with that message.
2. Most likely a model upgrade changed the JSON output. Bump `AI_TRANSLATOR_MODEL` to a known-good version or tighten the prompt in `src/infra/translator.aiGateway.ts`.

### "Push notifications not arriving"

1. Confirm subscriptions exist: `SMEMBERS push:subscriptions` in Upstash.
2. Confirm VAPID keys match the keys used when the browser subscribed. If you rotate VAPID keys, existing subscriptions are invalidated and must re-subscribe.
3. Check Vercel logs for `webpush` errors — most often 410 Gone (subscription expired; safe to drop) or 413 (payload too large).

### "Rate limiter denying legit traffic"

1. Increase `RATE_LIMIT_PER_MINUTE` env var and redeploy, or drop specific keys: `DEL rl:<key>:<bucket>` in Upstash.

## Backups

Upstash is the single source of truth for songs, lessons, attempts, and SRS cards. Take a periodic dump:

```bash
upstash redis cli SCAN 0 MATCH '*' COUNT 1000  # iterate; dump values to JSON
```

Restore by re-running `npm run seed` against the same database.

## Decommission

`vercel env rm`, `upstash db delete`, archive the repo. The PWA service worker will fall back to its cached shell until the cache expires.
