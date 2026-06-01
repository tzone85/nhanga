import { NextResponse } from "next/server";
import { z } from "zod";
import { compose } from "@/src/composition";
import { runQuiz } from "@application/runQuiz";
import type { QuizItemResult } from "@domain/lesson";
import { clientIpFromHeaders } from "@infra/rateLimit";
import { apiError, handleUnexpected } from "@infra/apiError";

const Schema = z.object({
  lessonId: z.string().min(1).max(50),
  startedAt: z.string().datetime(),
  results: z
    .array(
      z.object({
        cardId: z.string().min(1).max(100),
        kind: z.enum(["cloze", "match", "translate", "listen", "morpheme"]),
        correct: z.boolean(),
        answeredAt: z.string().datetime(),
        userAnswer: z.string().max(2_000).optional(),
      }),
    )
    .max(200),
});

export async function POST(req: Request) {
  try {
    const deps = compose();
    const ip = clientIpFromHeaders(req.headers);
    const decision = await deps.rateLimit(`attempts:post:${ip}`);
    if (!decision.allowed) {
      return apiError("RATE_LIMITED", "too many requests", 429);
    }
    const json = await req.json().catch(() => null);
    if (json === null) return apiError("BAD_JSON", "invalid JSON body", 400);
    const parsed = Schema.safeParse(json);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", "invalid input", 400, {
        issues: parsed.error.flatten(),
      });
    }
    const results: readonly QuizItemResult[] = parsed.data.results.map(
      (r): QuizItemResult => ({
        cardId: r.cardId,
        kind: r.kind,
        correct: r.correct,
        answeredAt: r.answeredAt,
        ...(r.userAnswer !== undefined ? { userAnswer: r.userAnswer } : {}),
      }),
    );
    const attempt = await runQuiz.finalise(
      {
        lessonId: parsed.data.lessonId,
        startedAt: parsed.data.startedAt,
        results,
      },
      deps,
    );
    return NextResponse.json({ data: attempt });
  } catch (err) {
    return handleUnexpected(err, "attempts.post");
  }
}
