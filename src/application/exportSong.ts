import type { Song } from "@domain/song";

const csvField = (raw: string): string => {
  if (raw === "") return "";
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
};

const morphemesOf = (line: Song["lines"][number]): string =>
  line.glosses
    .flatMap((g) => g.morphemes ?? [])
    .join(" | ");

export const toCsv = (song: Song): string => {
  const header = "index,shona,english,confidence,morphemes";
  const rows = song.lines.map((l) =>
    [
      String(l.index),
      csvField(l.shona),
      csvField(l.english),
      l.confidence,
      csvField(morphemesOf(l)),
    ].join(","),
  );
  return [header, ...rows].join("\n") + "\n";
};

const safeTag = (s: string): string => s.replace(/\s+/g, "_");
const ankiField = (s: string): string =>
  s.replace(/\t/g, " ").replace(/\r?\n/g, "<br>");

export const toAnkiTsv = (song: Song): string => {
  const tags = `${safeTag(song.title)} ${safeTag(song.artist)}`.trim();
  return (
    song.lines
      .map(
        (l) => `${ankiField(l.shona)}\t${ankiField(l.english)}\t${tags}`,
      )
      .join("\n") + "\n"
  );
};

export const exportFilename = (song: Song, ext: "csv" | "tsv"): string => {
  const slug = `${song.artist}-${song.title}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return `${slug || song.id}.${ext}`;
};
