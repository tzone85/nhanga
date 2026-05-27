import { getISOWeek, getISOWeekYear } from "date-fns";

export type QuizItemKind = "cloze" | "match" | "translate" | "listen" | "morpheme";

export interface QuizItemResult {
  readonly cardId: string;
  readonly kind: QuizItemKind;
  readonly correct: boolean;
  readonly answeredAt: string;
  readonly userAnswer?: string;
}

export interface QuizAttempt {
  readonly id: string;
  readonly lessonId: string;
  readonly startedAt: string;
  readonly finishedAt?: string;
  readonly items: readonly QuizItemResult[];
  readonly score?: number;
}

export interface Lesson {
  readonly id: string;
  readonly songId: string;
  readonly weekIso: string;
  readonly createdAt: string;
  readonly passScore: number;
}

export const weekIsoFor = (d: Date): string =>
  `${getISOWeekYear(d)}-W${String(getISOWeek(d)).padStart(2, "0")}`;

export const computeScore = (results: readonly boolean[]): number => {
  if (results.length === 0) return 0;
  return results.filter(Boolean).length / results.length;
};
