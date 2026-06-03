import { NextResponse } from "next/server";
import { compose } from "@/src/composition";
import { apiError, handleUnexpected } from "@infra/apiError";
import { toCsv, toAnkiTsv } from "@application/exportSong";

const ALLOWED = new Set(["csv", "anki"] as const);

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const format = (url.searchParams.get("format") ?? "csv").toLowerCase();
    if (!ALLOWED.has(format as "csv" | "anki")) {
      return apiError("INVALID_FORMAT", "format must be csv or anki", 400);
    }

    const { store } = compose();
    const songs = await store.listSongs();

    if (format === "anki") {
      const body = songs.map((s) => toAnkiTsv(s)).join("");
      return new NextResponse(body, {
        status: 200,
        headers: {
          "content-type": "text/tab-separated-values; charset=utf-8",
          "content-disposition": 'attachment; filename="nhanga-library.tsv"',
          "cache-control": "no-store",
        },
      });
    }

    const csvField = (raw: string): string =>
      /[",\n\r]/.test(raw) ? `"${raw.replace(/"/g, '""')}"` : raw;

    const withSongCols = (s: (typeof songs)[number]) => {
      const csv = toCsv(s);
      const [header, ...rows] = csv.split("\n");
      const augmented = rows
        .filter(Boolean)
        .map((r) => `${csvField(s.title)},${csvField(s.artist)},${r}`)
        .join("\n");
      return { header: header ?? "", augmented };
    };

    if (songs.length === 0) {
      return new NextResponse(
        "title,artist,index,shona,english,confidence,morphemes\n",
        {
          status: 200,
          headers: {
            "content-type": "text/csv; charset=utf-8",
            "content-disposition": 'attachment; filename="nhanga-library.csv"',
            "cache-control": "no-store",
          },
        },
      );
    }

    const parts = songs.map(withSongCols);
    const header = `title,artist,${parts[0]!.header}`;
    const body = [header, ...parts.map((p) => p.augmented)].join("\n") + "\n";

    return new NextResponse(body, {
      status: 200,
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": 'attachment; filename="nhanga-library.csv"',
        "cache-control": "no-store",
      },
    });
  } catch (err) {
    return handleUnexpected(err, "library.export");
  }
}
