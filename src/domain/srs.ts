import { addDays } from "date-fns";

export type SrsGrade = "correct" | "wrong";

export interface SrsCard {
  readonly id: string;
  readonly kind: "line" | "gloss";
  readonly ease: number;
  readonly intervalDays: number;
  readonly dueAt: string;
  readonly lapses: number;
}

const EASE_MIN = 1.3;
const EASE_MAX = 3.0;
const EASE_STEP_UP = 0.10;
const EASE_STEP_DOWN = 0.20;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export const newCard = (id: string, kind: SrsCard["kind"], now: Date): SrsCard => ({
  id, kind, ease: 2.5, intervalDays: 0, dueAt: now.toISOString(), lapses: 0
});

export const schedule = (card: SrsCard, grade: SrsGrade, now: Date): SrsCard => {
  if (grade === "correct") {
    const interval = Math.max(1, Math.round(card.intervalDays * card.ease));
    return {
      ...card,
      intervalDays: interval,
      ease: clamp(card.ease + EASE_STEP_UP, EASE_MIN, EASE_MAX),
      dueAt: addDays(now, interval).toISOString()
    };
  }
  return {
    ...card,
    intervalDays: 1,
    ease: clamp(card.ease - EASE_STEP_DOWN, EASE_MIN, EASE_MAX),
    lapses: card.lapses + 1,
    dueAt: addDays(now, 1).toISOString()
  };
};
