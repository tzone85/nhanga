import { describe, it, expect, vi } from "vitest";
import { fixedWindowRateLimit, clientIpFromHeaders } from "@infra/rateLimit";

const fakeRedis = (counts: Map<string, number>) => ({
  incr: vi.fn(async (k: string) => {
    const next = (counts.get(k) ?? 0) + 1;
    counts.set(k, next);
    return next;
  }),
  expire: vi.fn(async () => 1 as 0 | 1),
});

describe("fixedWindowRateLimit", () => {
  it("allows up to limit and denies after", async () => {
    const counts = new Map<string, number>();
    const redis = fakeRedis(counts);
    const now = () => 1_700_000_000_000;
    const limiter = fixedWindowRateLimit({
      redis,
      limit: 3,
      windowSec: 60,
      now,
    });

    const d1 = await limiter("ip:1.2.3.4");
    const d2 = await limiter("ip:1.2.3.4");
    const d3 = await limiter("ip:1.2.3.4");
    const d4 = await limiter("ip:1.2.3.4");

    expect(d1.allowed).toBe(true);
    expect(d2.allowed).toBe(true);
    expect(d3.allowed).toBe(true);
    expect(d4.allowed).toBe(false);
    expect(d3.remaining).toBe(0);
    expect(d4.remaining).toBe(0);
  });

  it("sets expiry exactly once per window", async () => {
    const counts = new Map<string, number>();
    const redis = fakeRedis(counts);
    const limiter = fixedWindowRateLimit({ redis, limit: 5, windowSec: 60 });
    await limiter("k");
    await limiter("k");
    await limiter("k");
    expect(redis.expire).toHaveBeenCalledTimes(1);
  });

  it("returns the bucket boundary as resetAt", async () => {
    const counts = new Map<string, number>();
    const redis = fakeRedis(counts);
    const now = () => 1_700_000_030_000; // mid-bucket
    const limiter = fixedWindowRateLimit({
      redis,
      limit: 1,
      windowSec: 60,
      now,
    });
    const d = await limiter("k");
    expect(d.resetAt % 60_000).toBe(0);
    expect(d.resetAt).toBeGreaterThan(now());
  });
});

describe("clientIpFromHeaders", () => {
  it("prefers x-forwarded-for first hop", () => {
    const h = new Headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" });
    expect(clientIpFromHeaders(h)).toBe("1.1.1.1");
  });

  it("falls back to x-real-ip", () => {
    const h = new Headers({ "x-real-ip": "3.3.3.3" });
    expect(clientIpFromHeaders(h)).toBe("3.3.3.3");
  });

  it("returns 'unknown' when nothing is set", () => {
    expect(clientIpFromHeaders(new Headers())).toBe("unknown");
  });
});
