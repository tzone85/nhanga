import { describe, it, expect } from "vitest";
import { splitShonaLines } from "@domain/song";

describe("splitShonaLines", () => {
  it("splits on \\n and \\r\\n, trims, and drops empties", () => {
    expect(splitShonaLines("  Mwari  \r\nanewe\n\n  Neria\n")).toEqual([
      "Mwari",
      "anewe",
      "Neria",
    ]);
  });

  it("returns empty array for empty input", () => {
    expect(splitShonaLines("")).toEqual([]);
    expect(splitShonaLines("   \n  \n")).toEqual([]);
  });
});
