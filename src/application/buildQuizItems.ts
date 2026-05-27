import type { Song } from "@domain/song";
import type { SrsCard } from "@domain/srs";
import { makeCloze, type ClozeItem } from "@domain/quiz";

export interface QuizSpec {
  readonly cloze: readonly ClozeItem[];
  readonly translate: readonly { readonly cardId: string; readonly shona: string; readonly expectedEnglish: string }[];
}

export const buildQuizItems = (song: Song, _dueCards: readonly SrsCard[]): QuizSpec => {
  const refined = song.lines.filter(l => l.confidence === "refined");
  const pool = refined.length > 0 ? refined : song.lines;
  const cloze = pool.slice(0, 3).map(l => makeCloze(l, l.index, 0));
  const translate = pool.slice(0, 3).map(l => ({
    cardId: `${song.id}:${l.index}`,
    shona: l.shona,
    expectedEnglish: l.english
  }));
  return { cloze, translate };
};
