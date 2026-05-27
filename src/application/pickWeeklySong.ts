import type { Song } from "@domain/song";
import type { QuizAttempt } from "@domain/lesson";

export const pickWeeklySong = (
  songs: readonly Song[],
  attempts: readonly QuizAttempt[],
  lessonToSong: ReadonlyMap<string, string> = new Map()
): Song => {
  if (songs.length === 0) throw new Error("No songs in library");

  const seenSongIds = new Set(
    attempts.map(a => lessonToSong.get(a.lessonId)).filter(Boolean) as string[]
  );

  const unseen = songs.filter(s => !seenSongIds.has(s.id));
  if (unseen.length > 0) {
    return [...unseen].sort((a, b) => a.addedAt.localeCompare(b.addedAt))[0]!;
  }

  const lowestScore = (songId: string): number => {
    const xs = attempts.filter(a => lessonToSong.get(a.lessonId) === songId).map(a => a.score ?? 1);
    return xs.length ? Math.min(...xs) : 1;
  };
  return [...songs].sort((a, b) => lowestScore(a.id) - lowestScore(b.id))[0]!;
};
