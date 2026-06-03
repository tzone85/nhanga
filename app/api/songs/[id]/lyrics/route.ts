import { NextResponse } from "next/server";
import { z } from "zod";
import { compose } from "@/src/composition";
import { addLyrics } from "@application/addLyrics";
import { isId } from "@domain/ids";
import { apiError, handleUnexpected } from "@infra/apiError";

const BodySchema = z.object({
  shonaLyrics: z.string().min(1).max(50_000),
});

export async function PUT(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    if (!isId(id)) return apiError("INVALID_ID", "invalid id", 400);
    const json = await req.json().catch(() => null);
    if (json === null) return apiError("BAD_JSON", "invalid JSON body", 400);
    const parsed = BodySchema.safeParse(json);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", "invalid input", 400, {
        issues: parsed.error.flatten(),
      });
    }
    const { store, translator } = compose();
    const result = await addLyrics(id, parsed.data.shonaLyrics, {
      store,
      translator,
    });
    return NextResponse.json({
      data: result.song,
      translated: result.translated,
      ...(result.reason !== undefined ? { reason: result.reason } : {}),
    });
  } catch (err) {
    if (err instanceof Error && err.message.includes("already has lines")) {
      return apiError("CONFLICT", "song already has lyrics", 409);
    }
    return handleUnexpected(err, "songs.lyrics.put");
  }
}
