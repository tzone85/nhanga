import { describe, it, expect } from "vitest";
import { toCsv, toAnkiTsv } from "@application/exportSong";
import type { Song } from "@domain/song";

const song: Song = {
  id: "01HSAMPLE",
  title: "Neria",
  artist: "Oliver Mtukudzi",
  youtubeUrl: "https://youtu.be/abc",
  addedAt: "2026-05-27T00:00:00Z",
  lines: [
    {
      index: 0,
      shona: "Neria",
      english: "Neria",
      glosses: [],
      confidence: "refined",
    },
    {
      index: 1,
      shona: 'Usacheme, "Neria"',
      english: "Don't cry,\nNeria",
      glosses: [
        {
          shonaToken: "Usacheme",
          englishGloss: "Don't cry",
          morphemes: ["u-", "sa-", "-cheme"],
        },
      ],
      confidence: "refined",
    },
    {
      index: 2,
      shona: "Mwari anewe",
      english: "",
      glosses: [],
      confidence: "draft",
    },
  ],
};

describe("toCsv", () => {
  it("emits a header row first", () => {
    const csv = toCsv(song);
    expect(csv.startsWith("index,shona,english,confidence,morphemes\n")).toBe(
      true,
    );
  });

  it("quotes fields with commas/quotes/newlines and escapes embedded quotes", () => {
    const csv = toCsv(song);
    expect(csv).toContain('"Usacheme, ""Neria"""');
    expect(csv).toContain('"Don\'t cry,\nNeria"');
  });

  it("emits simple fields without quoting", () => {
    const csv = toCsv(song);
    expect(csv).toContain("0,Neria,Neria,refined,\n");
  });

  it("joins morphemes with ' | '", () => {
    const csv = toCsv(song);
    expect(csv).toContain("u- | sa- | -cheme");
  });

  it("ends with a trailing newline", () => {
    expect(toCsv(song).endsWith("\n")).toBe(true);
  });
});

describe("toAnkiTsv", () => {
  it("emits Shona<TAB>English<TAB>tags, escaping tabs/newlines in fields", () => {
    const tsv = toAnkiTsv(song);
    const rows = tsv.trimEnd().split("\n");
    expect(rows).toHaveLength(3);
    expect(rows[0]).toBe("Neria\tNeria\tNeria Oliver_Mtukudzi");
    // Newline becomes <br>, tab becomes space
    expect(rows[1]).toMatch(/Usacheme, "Neria"\tDon't cry,<br>Neria\t/);
  });

  it("includes lines without English (so the user can study Shona-only and add answers later)", () => {
    const tsv = toAnkiTsv(song);
    const rows = tsv.trimEnd().split("\n");
    expect(rows[2]).toMatch(/^Mwari anewe\t\t/);
  });
});
