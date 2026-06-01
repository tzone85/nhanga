import { NextResponse } from "next/server";
import { z } from "zod";
import { compose } from "@/src/composition";
import { refineLine } from "@application/refineLine";
import type { Gloss, LinePatch } from "@domain/song";
import { isId } from "@domain/ids";
import { apiError, handleUnexpected } from "@infra/apiError";

const PatchSchema = z.object({
  lineIndex: z.number().int().nonnegative().max(10_000),
  english: z.string().min(1).max(2_000).optional(),
  glosses: z
    .array(
      z.object({
        shonaToken: z.string().min(1).max(100),
        englishGloss: z.string().min(1).max(200),
        morphemes: z.array(z.string().min(1).max(100)).max(20).optional(),
      }),
    )
    .max(50)
    .optional(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    if (!isId(id)) return apiError("INVALID_ID", "invalid id", 400);
    const { store } = compose();
    const s = await store.getSong(id);
    if (!s) return apiError("NOT_FOUND", "not found", 404);
    return NextResponse.json({ data: s });
  } catch (err) {
    return handleUnexpected(err, "songs.get");
  }
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    if (!isId(id)) return apiError("INVALID_ID", "invalid id", 400);
    const json = await req.json().catch(() => null);
    if (json === null) return apiError("BAD_JSON", "invalid JSON body", 400);
    const parsed = PatchSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", "invalid input", 400, {
        issues: parsed.error.flatten(),
      });
    }
    const { lineIndex, english, glosses } = parsed.data;
    const patch: LinePatch = {
      ...(english !== undefined ? { english } : {}),
      ...(glosses !== undefined
        ? {
            glosses: glosses.map(
              (g): Gloss => ({
                shonaToken: g.shonaToken,
                englishGloss: g.englishGloss,
                ...(g.morphemes !== undefined ? { morphemes: g.morphemes } : {}),
              }),
            ),
          }
        : {}),
    };
    const { store } = compose();
    await refineLine(id, lineIndex, patch, { store });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return handleUnexpected(err, "songs.patch");
  }
}
