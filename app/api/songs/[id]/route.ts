import { NextResponse } from "next/server";
import { z } from "zod";
import { compose } from "@/src/composition";
import { refineLine } from "@application/refineLine";
import type { Gloss, LinePatch } from "@domain/song";

const PatchSchema = z.object({
  lineIndex: z.number().int().nonnegative(),
  english: z.string().optional(),
  glosses: z
    .array(
      z.object({
        shonaToken: z.string(),
        englishGloss: z.string(),
        morphemes: z.array(z.string()).optional(),
      }),
    )
    .optional(),
});

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const { store } = compose();
  const s = await store.getSong(id);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json({ data: s });
}

export async function PATCH(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const { id } = await ctx.params;
  const parsed = PatchSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
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
}
