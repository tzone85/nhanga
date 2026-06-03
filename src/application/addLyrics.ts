import type { Song } from "@domain/song";
import { splitShonaLines } from "@domain/song";
import type { Translator } from "@ports/translator";
import type { ProgressStore } from "@ports/progressStore";

export interface AddLyricsDeps {
  readonly store: ProgressStore;
  readonly translator: Translator;
}

export interface AddLyricsResult {
  readonly song: Song;
  readonly translated: boolean;
  readonly reason?: string;
}

interface DraftLine {
  readonly shona: string;
  readonly english: string;
  readonly glosses: Song["lines"][number]["glosses"];
}

const draftOrManual = async (
  shona: string,
  translator: Translator,
): Promise<{
  lines: readonly DraftLine[];
  translated: boolean;
  reason?: string;
}> => {
  try {
    const draft = await translator.draft(shona);
    return { lines: draft.lines, translated: true };
  } catch (err) {
    const reason = err instanceof Error ? err.message : "translation failed";
    return {
      lines: splitShonaLines(shona).map((s) => ({
        shona: s,
        english: "",
        glosses: [],
      })),
      translated: false,
      reason,
    };
  }
};

export const addLyrics = async (
  songId: string,
  shonaLyrics: string,
  deps: AddLyricsDeps,
): Promise<AddLyricsResult> => {
  const song = await deps.store.getSong(songId);
  if (!song) throw new Error(`Song ${songId} not found`);
  if (song.lines.length > 0) throw new Error("Song already has lines");

  const drafted = await draftOrManual(shonaLyrics, deps.translator);

  const updated: Song = {
    ...song,
    lines: drafted.lines.map((l, i) => ({
      index: i,
      shona: l.shona,
      english: l.english,
      glosses: l.glosses,
      confidence: "draft" as const,
    })),
  };

  await deps.store.upsertSong(updated);
  return {
    song: updated,
    translated: drafted.translated,
    ...(drafted.reason !== undefined ? { reason: drafted.reason } : {}),
  };
};
