# Push Notifications

Web Push is the only background channel into the PWA.

Subscription: the client posts a serialised `PushSubscription` to `POST /api/push/subscriptions`. The handler validates with Zod, generates an internal id, and stores both the subscription set (`push:subscriptions`) and the subscription record (`push:sub:<id>`) in Upstash.

Delivery: `WebPushNotifier.notify({ title, body, url })` loads all subscriptions, serialises the payload as JSON, and dispatches via `web-push` with VAPID. Failures are swallowed individually (`Promise.allSettled`) — a single bad subscription must not break the broadcast.

Service worker `public/sw.js` handles `push` and `notificationclick`. Clicking opens the URL the payload carries (defaults to `/learn`).

Failure modes: see `docs/runbook.md` § "Push notifications not arriving".
