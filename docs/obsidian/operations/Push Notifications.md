# Push Notifications

Web Push is the only background channel into the PWA.

## Subscription flow

The client posts a serialised `PushSubscription` to `POST /api/push/subscriptions`. The handler:

1. Rate-limits the caller IP at 5/min via Upstash.
2. Validates the body with Zod: `endpoint` (URL), `keys.p256dh`, `keys.auth`.
3. **Checks `isAllowedPushEndpoint(endpoint)`** — the host must be HTTPS and match one of the known web-push service suffixes (Mozilla autopush, FCM, Apple, Windows Notify). This is a deliberate SSRF guard: `webpush.sendNotification` will later fetch this URL server-side on every Sunday cron, so persisting an arbitrary endpoint would weaponise the cron job.
4. Generates an internal id and stores the subscription set (`push:subscriptions`) and record (`push:sub:<id>`) in Upstash.

## Delivery

`WebPushNotifier.notify({ title, body, url })` loads all subscriptions, serialises the payload as JSON, and dispatches via `web-push` with VAPID. Failures are swallowed individually (`Promise.allSettled`) — a single bad subscription must not break the broadcast.

Service worker `public/sw.js` handles `push` and `notificationclick`. Clicking opens the URL the payload carries (defaults to `/learn`).

## Known gaps

- **No authentication on subscription creation.** Anonymous callers can register valid push-service endpoints; rate limiting (5/min/IP) is the only barrier. Tracked in `SECURITY.md`.
- **No revocation on 410 Gone.** Stale endpoints persist until manually pruned in Upstash.

Failure modes: see `docs/runbook.md` § "Push notifications not arriving".
