import { describe, it, expect } from "vitest";
import { apiError, handleUnexpected } from "@infra/apiError";

describe("apiError", () => {
  it("returns the requested status, code and message with a request id", async () => {
    const res = apiError("INVALID_INPUT", "bad input", 400);
    expect(res.status).toBe(400);
    expect(res.headers.get("x-request-id")).toBeTruthy();
    const body = await res.json();
    expect(body).toEqual({
      error: "bad input",
      code: "INVALID_INPUT",
      requestId: res.headers.get("x-request-id"),
    });
  });
});

describe("handleUnexpected", () => {
  it("never leaks the internal error message", async () => {
    const res = handleUnexpected(new Error("kaboom — secret value"), "test.route");
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("internal error");
    expect(body.code).toBe("INTERNAL");
    expect(JSON.stringify(body)).not.toContain("kaboom");
  });
});
