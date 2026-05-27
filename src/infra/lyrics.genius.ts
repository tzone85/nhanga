import type { LyricsSource } from "@ports/lyricsSource";
// Genius official API returns metadata, not lyric text. V1 ships a stub that returns null.
export const genius: LyricsSource = { async fetch() { return null; } };
