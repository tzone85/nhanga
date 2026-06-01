import { describe, it, expect } from "vitest";
import { isAuthorisedCron } from "@infra/auth.cron";

const SECRET = "x".repeat(32);

describe("isAuthorisedCron", () => {
  it("accepts a matching Bearer secret", () => {
    expect(isAuthorisedCron(`Bearer ${SECRET}`, SECRET)).toBe(true);
  });

  it("rejects a wrong secret", () => {
    expect(isAuthorisedCron(`Bearer ${"y".repeat(32)}`, SECRET)).toBe(false);
  });

  it("rejects a missing header", () => {
    expect(isAuthorisedCron(null, SECRET)).toBe(false);
  });

  it("rejects when env secret is missing", () => {
    expect(isAuthorisedCron(`Bearer ${SECRET}`, undefined)).toBe(false);
  });

  it("rejects when env secret is too short (< 16)", () => {
    expect(isAuthorisedCron("Bearer short", "short")).toBe(false);
  });

  it("rejects header without Bearer prefix", () => {
    expect(isAuthorisedCron(SECRET, SECRET)).toBe(false);
  });

  it("rejects length-mismatched header without leaking via thrown error", () => {
    expect(isAuthorisedCron("Bearer x", SECRET)).toBe(false);
  });
});
