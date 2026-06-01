# Home

Nhanga is one-song-a-week Shona learning with a Sunday quiz, delivered as a PWA.

## Read first
- [[Clean Architecture]] — why the four-layer split exists
- [[Composition Root]] — the only place adapters meet ports
- [[Sunday Pick]] — what happens at 07:00 UTC every Sunday
- [[Security Posture]] — what the threat model actually is

## Build the picture
- The **[[Domain Layer]]** has no IO. It just knows about [[Song]], [[Lesson]], [[QuizAttempt]], and [[SrsCard]].
- The **[[Application Layer]]** orchestrates use cases over [[Ports Layer|ports]].
- The **[[Infra Layer]]** adapts external services to ports: Upstash, AI Gateway, YouTube oEmbed, lyrics.ovh, web-push.
- The Next.js `app/` directory is a delivery mechanism — it imports use cases and calls `compose()` once per request.

## Glance at posture
- [[Rate Limiting]] guards POST endpoints.
- [[Share Target]] only accepts YouTube URLs.
- [[Push Notifications]] go through VAPID-signed Web Push.
- See [[Security Posture]] for the full list.
