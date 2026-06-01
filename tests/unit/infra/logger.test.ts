import { describe, it, expect, vi, afterEach } from "vitest";
import { logger } from "@infra/logger";

describe("logger", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("is silent in test mode (no stdout/stderr writes)", () => {
    const out = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    const err = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    logger.info("x");
    logger.warn("y");
    logger.error("z");
    expect(out).not.toHaveBeenCalled();
    expect(err).not.toHaveBeenCalled();
    out.mockRestore();
    err.mockRestore();
  });

  it("writes errors to stderr and info to stdout in non-test mode", () => {
    vi.stubEnv("NODE_ENV", "production");
    const out = vi
      .spyOn(process.stdout, "write")
      .mockImplementation(() => true);
    const err = vi
      .spyOn(process.stderr, "write")
      .mockImplementation(() => true);
    logger.info("hello", { a: 1 });
    logger.error("nope", { b: 2 });
    expect(out).toHaveBeenCalledOnce();
    expect(err).toHaveBeenCalledOnce();
    const outPayload = out.mock.calls[0]![0] as string;
    expect(outPayload).toContain('"event":"hello"');
    expect(outPayload).toContain('"level":"info"');
    out.mockRestore();
    err.mockRestore();
  });
});
