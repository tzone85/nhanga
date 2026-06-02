import type { Song } from "@domain/song";
import type { Translator } from "@ports/translator";
import type { ProgressStore } from "@ports/progressStore";

export interface AddLyricsDeps {
  readonly store: ProgressStore;
  readonly translator: Translator;
}

export const addLyrics = async (
  songId: string,
  shonaLyrics: string,
  deps: AddLyricsDeps,
): Promise<Song> => {
  const song = await deps.store.getSong(songId);
  if (!song) throw new Error(`Song ${songId} not found`);
  if (song.lines.length > 0) throw new Error("Song already has lines");

  const draft = await deps.translator.draft(shonaLyrics);

  const updated: Song = {
    ...song,
    lines: draft.lines.map((l, i) => ({
      index: i,
      shona: l.shona,
      english: l.english,
      glosses: l.glosses,
      confidence: "draft" as const,
    })),
  };

  await deps.store.upsertSong(updated);
  return updated;
};
