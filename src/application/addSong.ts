import type { Song } from "@domain/song";
import { splitShonaLines } from "@domain/song";
import type { Translator } from "@ports/translator";
import type { LyricsSource } from "@ports/lyricsSource";
import type { VideoAdapter } from "@ports/videoAdapter";
import type { ProgressStore } from "@ports/progressStore";
import type { Clock } from "@ports/clock";

export interface AddSongInput {
  readonly url?: string;
  readonly pastedLyrics?: string;
  readonly titleHint?: string;
}

export interface AddSongDeps {
  readonly video: VideoAdapter;
  readonly lyrics: LyricsSource;
  readonly translator: Translator;
  readonly store: ProgressStore;
  readonly clock: Clock;
  readonly idGen: () => string;
}

export interface AddSongResult {
  readonly song: Song;
  readonly translated: boolean;
  readonly reason?: string;
}

export const addSong = async (
  input: AddSongInput,
  deps: AddSongDeps,
): Promise<AddSongResult> => {
  let title = input.titleHint ?? "Untitled";
  let artist = "Unknown";

  if (input.url) {
    const meta = await deps.video.fetchMetadata(input.url);
    title = meta.title;
    artist = meta.authorName;
  }

  const shonaLyrics =
    input.pastedLyrics ?? (await deps.lyrics.fetch({ title, artist })) ?? "";

  let lines: Song["lines"] = [];
  let translated = true;
  let reason: string | undefined;

  if (shonaLyrics.trim().length > 0) {
    try {
      const draft = await deps.translator.draft(shonaLyrics);
      lines = draft.lines.map((l, i) => ({
        index: i,
        shona: l.shona,
        english: l.english,
        glosses: l.glosses,
        confidence: "draft" as const,
      }));
    } catch (err) {
      translated = false;
      reason = err instanceof Error ? err.message : "translation failed";
      lines = splitShonaLines(shonaLyrics).map((s, i) => ({
        index: i,
        shona: s,
        english: "",
        glosses: [],
        confidence: "draft" as const,
      }));
    }
  }

  const song: Song = {
    id: deps.idGen(),
    title,
    artist,
    ...(input.url ? { youtubeUrl: input.url } : {}),
    lines,
    addedAt: deps.clock.now().toISOString(),
  };

  await deps.store.upsertSong(song);
  return {
    song,
    translated,
    ...(reason !== undefined ? { reason } : {}),
  };
};
