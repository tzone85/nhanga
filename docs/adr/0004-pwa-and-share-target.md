# ADR 0004 — PWA shell with Web Share Target

**Status:** Accepted
**Date:** 2026-05-27

## Context

The intended primary input device is iOS Safari + the YouTube share sheet. The user listens, taps Share → Nhanga, and the lyrics are ingested for the upcoming Sunday quiz. A native app is overkill for this loop.

## Decision

- Ship as an installable PWA via `public/manifest.webmanifest`.
- Register a Service Worker (`public/sw.js`) with cache-first strategy on the shell and pass-through for API calls.
- Use the Web Manifest `share_target` to register `/share` as a GET handler accepting `title`, `text`, `url`.
- `/share` validates the candidate URL against a YouTube host allowlist before invoking the `addSong` use case, then redirects to `/learn/<id>`.

## Consequences

- Cross-platform with zero app-store overhead. iOS Safari is the constraint that shapes most UX trade-offs.
- The service worker is a security surface. CSP includes `worker-src 'self'`, and the SW only caches GETs to same-origin.
- An evil sender that tricks the user into sharing a non-YouTube URL is rejected at `/share` with a visible message — no silent ingestion.
