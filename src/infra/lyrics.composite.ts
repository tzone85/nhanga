import type { LyricsSource } from "@ports/lyricsSource";
import { lyricsOvh } from "./lyrics.lyricsOvh";
import { genius } from "./lyrics.genius";

export const compositeLyrics = (
  sources: readonly LyricsSource[] = [genius, lyricsOvh]
): LyricsSource => ({
  async fetch(q) {
    for (const s of sources) {
      try {
        const r = await s.fetch(q);
        if (r) return r;
      } catch {
        // try next
      }
    }
    return null;
  }
});
