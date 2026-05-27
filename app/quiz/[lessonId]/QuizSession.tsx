"use client";
import { useMemo, useState } from "react";
import type { QuizSpec } from "@application/buildQuizItems";
import { QuizCloze } from "@ui/components/QuizCloze";
import { QuizTranslate } from "@ui/components/QuizTranslate";
import { gradeTranslate } from "@domain/quiz";

interface ResultLite {
  readonly cardId: string;
  readonly kind: "cloze" | "translate";
  readonly correct: boolean;
  readonly answeredAt: string;
  readonly userAnswer: string;
}

export const QuizSession = ({ lessonId, spec }: { lessonId: string; spec: QuizSpec }) => {
  const items = useMemo(() => [
    ...spec.cloze.map((c, i) => ({ key: `c-${i}`, kind: "cloze" as const, payload: c })),
    ...spec.translate.map((t, i) => ({ key: `t-${i}`, kind: "translate" as const, payload: t }))
  ], [spec]);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<ResultLite[]>([]);
  const [done, setDone] = useState<{ score: number } | null>(null);
  const [startedAt] = useState(() => new Date().toISOString());

  if (done) {
    return (
      <main className="max-w-2xl mx-auto p-6 text-center">
        <h2 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--color-shavi)] mb-3">
          Score
        </h2>
        <div data-score className="text-5xl font-medium">{Math.round(done.score * 100)}%</div>
        <p className="opacity-70 mt-3">{done.score >= 0.8 ? "Pass" : "Try again next Sunday"}</p>
      </main>
    );
  }

  const current = items[idx];
  if (!current) return null;

  const next = async (cardId: string, correct: boolean, userAnswer: string) => {
    const updated: ResultLite[] = [...results, {
      cardId, kind: current.kind, correct,
      answeredAt: new Date().toISOString(), userAnswer
    }];
    if (idx + 1 < items.length) {
      setResults(updated);
      setIdx(idx + 1);
      return;
    }
    const res = await fetch("/api/attempts", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lessonId, startedAt, results: updated })
    });
    const { data } = await res.json() as { data: { score: number } };
    setDone({ score: data.score });
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="opacity-60 text-sm">{idx + 1} / {items.length}</div>
      {current.kind === "cloze" && (
        <QuizCloze
          english={current.payload.english}
          masked={current.payload.masked}
          onAnswer={(a) => next(`cloze-${idx}`, a.trim().toLowerCase() === current.payload.answer.toLowerCase(), a)}
        />
      )}
      {current.kind === "translate" && (
        <QuizTranslate
          shona={current.payload.shona}
          onAnswer={(a) => next(current.payload.cardId, gradeTranslate(current.payload.expectedEnglish, a), a)}
        />
      )}
    </main>
  );
};
