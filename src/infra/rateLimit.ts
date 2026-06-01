import type { Redis } from "@upstash/redis";

export interface RateLimitDecision {
  readonly allowed: boolean;
  readonly remaining: number;
  readonly resetAt: number;
}

export interface RateLimitDeps {
  readonly redis: Pick<Redis, "incr" | "expire">;
  readonly limit: number;
  readonly windowSec: number;
  readonly now?: () => number;
}

export const fixedWindowRateLimit = (deps: RateLimitDeps) =>
  async (key: string): Promise<RateLimitDecision> => {
    const now = (deps.now ?? Date.now)();
    const bucket = Math.floor(now / (deps.windowSec * 1000));
    const k = `rl:${key}:${bucket}`;
    const count = await deps.redis.incr(k);
    if (count === 1) await deps.redis.expire(k, deps.windowSec);
    const resetAt = (bucket + 1) * deps.windowSec * 1000;
    return {
      allowed: count <= deps.limit,
      remaining: Math.max(0, deps.limit - count),
      resetAt
    };
  };

export const clientIpFromHeaders = (h: Headers): string =>
  (h.get("x-forwarded-for")?.split(",")[0]?.trim()) ||
  h.get("x-real-ip") ||
  "unknown";
