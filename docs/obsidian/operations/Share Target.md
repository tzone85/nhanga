# Share Target

Nhanga registers itself as a Web Share Target via the manifest:

```json
"share_target": {
  "action": "/share",
  "method": "GET",
  "params": { "title": "title", "text": "text", "url": "url" }
}
```

Flow:

1. User taps Share on YouTube → picks Nhanga.
2. The OS opens `/share?url=...&title=...&text=...`.
3. The route extracts a URL (from `url`, or a regex match against `text`).
4. `isAllowedYouTubeUrl` rejects anything outside the YouTube host allowlist.
5. `addSong` runs server-side; on success the response redirects to `/learn/<id>`.

Tested by `tests/e2e/share-target.spec.ts` (Playwright).

Related: [[Security Posture]] for why the allowlist exists.
