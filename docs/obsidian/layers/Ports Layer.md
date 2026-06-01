# Ports Layer

`src/ports/` — interfaces only. **No implementations.**

- `clock.ts` — `Clock { now(): Date }`. Tests pass `fixedClock(d)`.
- `progressStore.ts` — `ProgressStore` for songs, lessons, attempts, cards.
- `translator.ts` — `Translator { draft(shonaLyrics): Promise<TranslationDraft> }`.
- `lyricsSource.ts` — `LyricsSource { fetch({ title, artist? }): Promise<string | null> }`.
- `videoAdapter.ts` — `VideoAdapter { fetchMetadata(url): Promise<VideoMetadata> }`.
- `notifier.ts` — `Notifier { notify({ title, body, url }): Promise<void> }`.

Concretes live in [[Infra Layer]]. Wiring lives in [[Composition Root]].
