import { describe, it, expect } from "vitest";
import { makeCloze, gradeTranslate, splitMorphemes } from "@domain/quiz";
import type { Line } from "@domain/song";

const line: Line = {
  index: 0,
  shona: "Ndinokuda nhanga",
  english: "I love the gathering hut",
  glosses: [],
  confidence: "refined"
};

describe("makeCloze", () => {
  it("hides one Shona token, returns the expected answer", () => {
    const c = makeCloze(line, 0, 0);
    expect(c.english).toBe("I love the gathering hut");
    expect(c.masked).toMatch(/_+ nhanga/);
    expect(c.answer).toBe("Ndinokuda");
  });
});

describe("gradeTranslate", () => {
  it("accepts case-insensitive exact match", () => {
    expect(gradeTranslate("My heart", "my heart")).toBe(true);
  });
  it("accepts within edit-distance 2", () => {
    expect(gradeTranslate("My heart", "My hart")).toBe(true);
  });
  it("rejects far misses", () => {
    expect(gradeTranslate("My heart", "your foot")).toBe(false);
  });
});

describe("splitMorphemes", () => {
  const canonical = ["ndi", "no", "ku", "da"];

  it("returns true for an exact match against the canonical split", () => {
    expect(splitMorphemes(["ndi", "no", "ku", "da"], canonical)).toBe(true);
  });
  it("returns true case-insensitively", () => {
    expect(splitMorphemes(["NDI", "No", "KU", "Da"], canonical)).toBe(true);
  });
  it("returns false when granularity differs", () => {
    expect(splitMorphemes(["ndino", "kuda"], canonical)).toBe(false);
  });
  it("returns false when length matches but a part is wrong", () => {
    expect(splitMorphemes(["ndi", "no", "ku", "ra"], canonical)).toBe(false);
  });
});
