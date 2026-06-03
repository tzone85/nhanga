# Changelog

All notable changes to Nhanga are recorded here. Format based on Keep a Changelog 1.1.0; the project follows Semantic Versioning.

## [Unreleased]

### Added
- **Per-song CSV and Anki TSV export** via `GET /api/songs/[id]/export?format=csv|anki`. Download buttons on each song page.
- **Library-wide export** via `GET /api/library/export?format=csv|anki`. CSV prepends `title,artist` columns; TSV concatenates all songs with `<title> <artist>` tags for Anki.
- Pure helpers `toCsv(song)`, `toAnkiTsv(song)`, `exportFilename(song, ext)` in `src/application/exportSong.ts`. RFC 4180 escaping (commas, quotes, newlines). Five unit tests.

### Changed
- **New theme: Sage Garden.** Warm linen background (`#f4f1ea`), deep forest text (`#1c2a22`), sage headings (`#2f5f47`), terracotta accent (`#c97a4f`), moss success (`#4f6b35`). Legacy CSS variable names kept as aliases so existing components compile without per-file edits.
- **LineEditor no longer truncates long English translations.** Single-line `<input>` replaced with auto-growing `<textarea>` (`rows={1}` + `scrollHeight` resize). Word-wrap on both Shona and English columns.
- `Button` adds a `secondary` variant (terracotta on linen) and uses semantic color tokens.
- Library page (`/learn`) header now has "Download all (CSV)" and "All as Anki TSV" actions when songs exist.

### Earlier
- Translator fallback (Shona-only persistence on failure), markdown-fence-stripping JSON parser, default model `gemini-2.5-flash-lite`, SSRF allowlist on push subscriptions, full prod hardening + OSS scaffolding.
