import { describe, it, expect } from "vitest";
import { refineLine, type Song } from "@domain/song";

const song: Song = {
  id: "s1",
  title: "Ndakuvara",
  artist: "Jah Prayzah",
  lines: [
    { index: 0, shona: "Ndakuvara", english: "I am hurt (draft)", glosses: [], confidence: "draft" },
    { index: 1, shona: "Mwoyo wangu", english: "My heart (draft)", glosses: [], confidence: "draft" }
  ],
  addedAt: "2026-05-27T00:00:00Z"
};

describe("song.refineLine", () => {
  it("updates english on the target line and marks it refined", () => {
    const next = refineLine(song, 1, { english: "My heart" });
    expect(next.lines[1]?.english).toBe("My heart");
    expect(next.lines[1]?.confidence).toBe("refined");
    expect(next.lines[0]?.confidence).toBe("draft");
  });

  it("does not mutate the original", () => {
    const snapshot = JSON.stringify(song);
    refineLine(song, 1, { english: "Other" });
    expect(JSON.stringify(song)).toBe(snapshot);
  });

  it("throws if line index is out of range", () => {
    expect(() => refineLine(song, 99, { english: "x" })).toThrow(/out of range/i);
  });
});
