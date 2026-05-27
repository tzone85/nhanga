import { z } from "zod";
import type { Translator, TranslationDraft } from "@ports/translator";

const responseSchema = z.object({
  lines: z.array(
    z.object({
      shona: z.string(),
      english: z.string(),
      glosses: z
        .array(
          z.object({
            shonaToken: z.string(),
            englishGloss: z.string(),
            morphemes: z.array(z.string()).optional(),
          }),
        )
        .default([]),
    }),
  ),
});

export interface GenerateText {
  (args: {
    model: string;
    prompt: string;
    temperature?: number;
  }): Promise<{ text: string }>;
}

const PROMPT = (shona: string) =>
  `
You translate Shona song lyrics into English. Return STRICT JSON only, matching:
{ "lines": [{ "shona": string, "english": string, "glosses": [{ "shonaToken": string, "englishGloss": string, "morphemes"?: string[] }] }] }

Rules:
- One JSON line per input line.
- English should be natural, not word-for-word.
- For agglutinative words (e.g. "ndinokuda"), include a morpheme split in glosses.
- No prose, no markdown, no code fences.

Lyrics:
${shona}
`.trim();

export const makeAiGatewayTranslator = (deps: {
  generateText: GenerateText;
  model?: string;
}): Translator => ({
  async draft(shonaLyrics: string): Promise<TranslationDraft> {
    if (!shonaLyrics.trim()) return { lines: [] };
    const { text } = await deps.generateText({
      model: deps.model ?? "anthropic/claude-sonnet-4-6",
      prompt: PROMPT(shonaLyrics),
      temperature: 0.2,
    });
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error("Invalid translator output: not JSON");
    }
    const result = responseSchema.safeParse(parsed);
    if (!result.success)
      throw new Error("Invalid translator output: shape mismatch");
    return {
      lines: result.data.lines.map((l) => ({
        shona: l.shona,
        english: l.english,
        glosses: l.glosses.map((g) => ({
          shonaToken: g.shonaToken,
          englishGloss: g.englishGloss,
          ...(g.morphemes ? { morphemes: g.morphemes } : {}),
        })),
      })),
    };
  },
});
