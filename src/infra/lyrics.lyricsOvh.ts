import type { LyricsSource } from "@ports/lyricsSource";

export const lyricsOvh: LyricsSource = {
  async fetch({ title, artist }) {
    if (!artist) return null;
    const url = `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as { lyrics?: string };
    return data.lyrics?.trim() || null;
  }
};
