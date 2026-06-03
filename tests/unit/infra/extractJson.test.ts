import { describe, it, expect } from "vitest";
import { extractJsonObject } from "@infra/extractJson";

describe("extractJsonObject", () => {
  it("returns the input unchanged when already a JSON object", () => {
    expect(extractJsonObject('{"a":1}')).toBe('{"a":1}');
  });

  it("strips ```json fences", () => {
    const wrapped = "```json\n{\"a\":1}\n```";
    expect(extractJsonObject(wrapped)).toBe('{"a":1}');
  });

  it("strips plain ``` fences", () => {
    const wrapped = "```\n{\"a\":1}\n```";
    expect(extractJsonObject(wrapped)).toBe('{"a":1}');
  });

  it("extracts the first balanced object when wrapped in prose", () => {
    const wrapped = 'Sure! Here is the JSON: {"a":1,"b":{"c":2}} hope that helps.';
    expect(extractJsonObject(wrapped)).toBe('{"a":1,"b":{"c":2}}');
  });

  it("returns null when no object is found", () => {
    expect(extractJsonObject("nothing here")).toBeNull();
  });

  it("returns null on unbalanced braces", () => {
    expect(extractJsonObject("{a:1")).toBeNull();
  });
});
