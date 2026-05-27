import type { Song } from "@domain/song";
import type { Lesson, QuizAttempt } from "@domain/lesson";
import type { SrsCard } from "@domain/srs";
export interface ProgressStore {
  listSongs(): Promise<readonly Song[]>;
  getSong(id: string): Promise<Song | null>;
  upsertSong(s: Song): Promise<void>;
  listLessons(): Promise<readonly Lesson[]>;
  createLesson(l: Lesson): Promise<void>;
  recordAttempt(a: QuizAttempt): Promise<void>;
  listAttempts(): Promise<readonly QuizAttempt[]>;
  listCards(): Promise<readonly SrsCard[]>;
  upsertCards(cards: readonly SrsCard[]): Promise<void>;
}
