import { describe, it, expect } from "vitest";
import { fixedClock } from "@ports/clock";

describe("fixedClock", () => {
  it("returns the same Date each call", () => {
    const t = new Date("2026-05-27T10:00:00Z");
    const c = fixedClock(t);
    expect(c.now().toISOString()).toBe(t.toISOString());
    expect(c.now().toISOString()).toBe(t.toISOString());
  });
});
