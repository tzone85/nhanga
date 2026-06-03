import { NextResponse } from "next/server";
import { compose } from "@/src/composition";
import { isId } from "@domain/ids";
import { apiError, handleUnexpected } from "@infra/apiError";
import {
  toCsv,
  toAnkiTsv,
  exportFilename,
} from "@application/exportSong";

const ALLOWED = new Set(["csv", "anki"] as const);

export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await ctx.params;
    if (!isId(id)) return apiError("INVALID_ID", "invalid id", 400);

    const url = new URL(req.url);
    const format = (url.searchParams.get("format") ?? "csv").toLowerCase();
    if (!ALLOWED.has(format as "csv" | "anki")) {
      return apiError("INVALID_FORMAT", "format must be csv or anki", 400);
    }

    const { store } = compose();
    const song = await store.getSong(id);
    if (!song) return apiError("NOT_FOUND", "song not found", 404);

    if (format === "anki") {
      return new NextResponse(toAnkiTsv(song), {
        status: 200,
        headers: {
          "content-type": "text/tab-separated-values; charset=utf-8",
          "content-disposition": `attachment; filename="${exportFilename(song, "tsv")}"`,
          "cache-control": "no-store",
        },
      });
    }

    return new NextResponse(toCsv(song), {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${exportFilename(song, "csv")}"`,
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    return handleUnexpected(err, "songs.export");
  }
}
