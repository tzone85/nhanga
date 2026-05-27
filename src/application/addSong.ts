import type { Song } from "@domain/song";
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

export const addSong = async (input: AddSongInput, deps: AddSongDeps): Promise<Song> => {
  let title = input.titleHint ?? "Untitled";
  let artist = "Unknown";

  if (input.url) {
    const meta = await deps.video.fetchMetadata(input.url);
    title = meta.title;
    artist = meta.authorName;
  }

  const shonaLyrics = input.pastedLyrics
    ?? (await deps.lyrics.fetch({ title, artist }))
    ?? "";

  const draft = await deps.translator.draft(shonaLyrics);

  const song: Song = {
    id: deps.idGen(),
    title,
    artist,
    ...(input.url ? { youtubeUrl: input.url } : {}),
    lines: draft.lines.map((l, i) => ({
      index: i, shona: l.shona, english: l.english, glosses: l.glosses, confidence: "draft"
    })),
    addedAt: deps.clock.now().toISOString()
  };

  await deps.store.upsertSong(song);
  return song;
};
