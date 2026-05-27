import { describe, it, expect } from "vitest";
import { newCard, schedule, type SrsCard } from "@domain/srs";

const now = new Date("2026-05-27T10:00:00Z");

describe("srs.newCard", () => {
  it("creates a card due today with ease 2.5", () => {
    const c = newCard("card-1", "line", now);
    expect(c.ease).toBe(2.5);
    expect(c.intervalDays).toBe(0);
    expect(c.lapses).toBe(0);
    expect(new Date(c.dueAt).toISOString()).toBe(now.toISOString());
  });
});

describe("srs.schedule", () => {
  const base: SrsCard = {
    id: "x", kind: "line", ease: 2.5, intervalDays: 1, dueAt: now.toISOString(), lapses: 0
  };

  it("on correct: extends interval by ease, raises ease", () => {
    const next = schedule(base, "correct", now);
    expect(next.intervalDays).toBe(3);
    expect(next.ease).toBeCloseTo(2.6);
    expect(next.lapses).toBe(0);
  });

  it("on wrong: resets interval, lowers ease, increments lapses", () => {
    const next = schedule(base, "wrong", now);
    expect(next.intervalDays).toBe(1);
    expect(next.ease).toBeCloseTo(2.3);
    expect(next.lapses).toBe(1);
  });

  it("ease clamps to [1.3, 3.0]", () => {
    let c: SrsCard = { ...base, ease: 1.3 };
    c = schedule(c, "wrong", now);
    expect(c.ease).toBe(1.3);
    c = { ...base, ease: 3.0 };
    c = schedule(c, "correct", now);
    expect(c.ease).toBe(3.0);
  });

  it("does not mutate the input", () => {
    const before = { ...base };
    schedule(base, "correct", now);
    expect(base).toEqual(before);
  });
});
