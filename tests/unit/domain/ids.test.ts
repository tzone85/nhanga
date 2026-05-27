import { describe, it, expect } from "vitest";
import { newId, isId } from "@domain/ids";

describe("ids", () => {
  it("newId returns a 26-char ulid-shaped string", () => {
    const id = newId();
    expect(id).toHaveLength(26);
    expect(isId(id)).toBe(true);
  });
  it("newId values are unique", () => {
    expect(newId()).not.toBe(newId());
  });
});
