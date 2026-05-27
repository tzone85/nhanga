import { NextResponse } from "next/server";
import { z } from "zod";
import { compose } from "@/src/composition";
import { runQuiz } from "@application/runQuiz";
import type { QuizItemResult } from "@domain/lesson";

const Schema = z.object({
  lessonId: z.string(),
  startedAt: z.string(),
  results: z.array(
    z.object({
      cardId: z.string(),
      kind: z.enum(["cloze", "match", "translate", "listen", "morpheme"]),
      correct: z.boolean(),
      answeredAt: z.string(),
      userAnswer: z.string().optional(),
    }),
  ),
});

export async function POST(req: Request) {
  const parsed = Schema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  const results: readonly QuizItemResult[] = parsed.data.results.map(
    (r): QuizItemResult => ({
      cardId: r.cardId,
      kind: r.kind,
      correct: r.correct,
      answeredAt: r.answeredAt,
      ...(r.userAnswer !== undefined ? { userAnswer: r.userAnswer } : {}),
    }),
  );
  const input = {
    lessonId: parsed.data.lessonId,
    startedAt: parsed.data.startedAt,
    results,
  };
  const deps = compose();
  const attempt = await runQuiz.finalise(input, deps);
  return NextResponse.json({ data: attempt });
}
