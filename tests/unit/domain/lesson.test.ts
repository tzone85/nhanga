import { describe, it, expect } from "vitest";
import { weekIsoFor, computeScore } from "@domain/lesson";

describe("weekIsoFor", () => {
  it("returns ISO week notation for a Sunday in May 2026", () => {
    expect(weekIsoFor(new Date("2026-05-24T09:00:00Z"))).toBe("2026-W21");
  });
});

describe("computeScore", () => {
  it("returns correct fraction", () => {
    expect(computeScore([true, true, false, true, false])).toBeCloseTo(0.6);
  });
  it("returns 0 for empty input", () => {
    expect(computeScore([])).toBe(0);
  });
});
