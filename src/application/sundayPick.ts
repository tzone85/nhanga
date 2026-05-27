import { pickWeeklySong } from "./pickWeeklySong";
import { weekIsoFor, type Lesson } from "@domain/lesson";
import type { ProgressStore } from "@ports/progressStore";
import type { Notifier } from "@ports/notifier";
import type { Clock } from "@ports/clock";

export interface SundayPickDeps {
  readonly store: ProgressStore;
  readonly notifier: Notifier;
  readonly clock: Clock;
  readonly idGen: () => string;
}

export const sundayPick = async (deps: SundayPickDeps): Promise<Lesson> => {
  const [songs, attempts, lessons] = await Promise.all([
    deps.store.listSongs(),
    deps.store.listAttempts(),
    deps.store.listLessons()
  ]);
  const lessonToSong = new Map(lessons.map(l => [l.id, l.songId]));
  const song = pickWeeklySong(songs, attempts, lessonToSong);
  const now = deps.clock.now();
  const lesson: Lesson = {
    id: deps.idGen(),
    songId: song.id,
    weekIso: weekIsoFor(now),
    createdAt: now.toISOString(),
    passScore: 0.8
  };
  await deps.store.createLesson(lesson);
  await deps.notifier.notify({
    title: "Today's Nhanga",
    body: `${song.title} — ${song.artist}`,
    url: `/quiz/${lesson.id}`
  });
  return lesson;
};
