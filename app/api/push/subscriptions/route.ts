import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getRedisForRuntime,
  subscriptionKey,
  subscriptionsKey,
} from "@/src/composition";
import { newId } from "@domain/ids";
import { apiError, handleUnexpected } from "@infra/apiError";
import { clientIpFromHeaders } from "@infra/rateLimit";
import { fixedWindowRateLimit } from "@infra/rateLimit";

const SubSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1).max(200),
    auth: z.string().min(1).max(200),
  }),
});

export async function POST(req: Request) {
  try {
    const redis = getRedisForRuntime();
    const limiter = fixedWindowRateLimit({ redis, limit: 5, windowSec: 60 });
    const ip = clientIpFromHeaders(req.headers);
    const decision = await limiter(`push:sub:${ip}`);
    if (!decision.allowed) return apiError("RATE_LIMITED", "too many requests", 429);

    const json = await req.json().catch(() => null);
    if (json === null) return apiError("BAD_JSON", "invalid JSON body", 400);
    const parsed = SubSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", "invalid input", 400, {
        issues: parsed.error.flatten(),
      });
    }
    const id = newId();
    await redis.set(subscriptionKey(id), parsed.data);
    await redis.sadd(subscriptionsKey, id);
    return NextResponse.json({ data: { id } }, { status: 201 });
  } catch (err) {
    return handleUnexpected(err, "push.subscribe");
  }
}
