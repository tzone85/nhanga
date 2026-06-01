import { describe, it, expect } from "vitest";
import { buildQuizItems } from "@application/buildQuizItems";
import type { Song } from "@domain/song";

const song = (
  confidences: ReadonlyArray<"draft" | "refined">,
): Song => ({
  id: "song-1",
  title: "T",
  artist: "A",
  addedAt: "2026-05-27T00:00:00.000Z",
  lines: confidences.map((c, i) => ({
    index: i,
    shona: `shona ${i}`,
    english: `english ${i}`,
    glosses: [],
    confidence: c,
  })),
});

describe("buildQuizItems", () => {
  it("uses refined lines when any exist", () => {
    const s = song(["draft", "refined", "draft", "refined"]);
    const spec = buildQuizItems(s, []);
    expect(spec.cloze).toHaveLength(2);
    expect(spec.translate).toHaveLength(2);
    expect(spec.translate.map((t) => t.shona)).toEqual(["shona 1", "shona 3"]);
  });

  it("falls back to draft lines if nothing is refined", () => {
    const s = song(["draft", "draft", "draft", "draft"]);
    const spec = buildQuizItems(s, []);
    expect(spec.cloze).toHaveLength(3);
    expect(spec.translate).toHaveLength(3);
  });
});
