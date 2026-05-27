import { refineLine as domainRefine, type LinePatch } from "@domain/song";
import type { ProgressStore } from "@ports/progressStore";

export const refineLine = async (
  songId: string,
  lineIndex: number,
  patch: LinePatch,
  deps: { store: ProgressStore }
): Promise<void> => {
  const song = await deps.store.getSong(songId);
  if (!song) throw new Error(`Song ${songId} not found`);
  await deps.store.upsertSong(domainRefine(song, lineIndex, patch));
};
