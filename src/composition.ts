import { Redis } from "@upstash/redis";
import webpush from "web-push";
import { generateText } from "ai";
import { newId } from "@domain/ids";
import { systemClock } from "@infra/clock.system";
import { makeKvStore } from "@infra/store.kv";
import { compositeLyrics } from "@infra/lyrics.composite";
import { youtubeVideo } from "@infra/video.youtube";
import { makeAiGatewayTranslator } from "@infra/translator.aiGateway";
import {
  makeWebPushNotifier,
  type PushSubscriptionLike,
} from "@infra/push.webpush";
import { fixedWindowRateLimit } from "@infra/rateLimit";

export const subscriptionsKey = "push:subscriptions";
export const subscriptionKey = (id: string) => `push:sub:${id}`;

const requireEnv = (name: string): string => {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
};

let redis: Redis | null = null;
const getRedis = (): Redis => {
  redis ??= new Redis({
    url: requireEnv("UPSTASH_REDIS_REST_URL"),
    token: requireEnv("UPSTASH_REDIS_REST_TOKEN"),
  });
  return redis;
};

export const compose = () => {
  const store = makeKvStore(getRedis());
  const translator = makeAiGatewayTranslator({
    generateText: async ({ model, prompt, temperature }) => {
      const r = await generateText({
        model,
        prompt,
        ...(temperature !== undefined ? { temperature } : {}),
      });
      return { text: r.text };
    },
  });

  const getSubscriptions = async (): Promise<
    readonly PushSubscriptionLike[]
  > => {
    const ids = await getRedis().smembers(subscriptionsKey);
    const subs = await Promise.all(
      ids.map((id) =>
        getRedis().get<PushSubscriptionLike>(subscriptionKey(id)),
      ),
    );
    return subs.filter((s): s is PushSubscriptionLike => s !== null);
  };
  const sendNotification = async (
    sub: PushSubscriptionLike,
    payload: string,
  ) => {
    webpush.setVapidDetails(
      requireEnv("VAPID_SUBJECT"),
      requireEnv("VAPID_PUBLIC_KEY"),
      requireEnv("VAPID_PRIVATE_KEY"),
    );
    return webpush.sendNotification(
      sub as unknown as webpush.PushSubscription,
      payload,
    );
  };
  const notifier = makeWebPushNotifier({ getSubscriptions, sendNotification });

  const limit = Number(process.env.RATE_LIMIT_PER_MINUTE ?? 20);
  const rateLimit = fixedWindowRateLimit({
    redis: getRedis(),
    limit: Number.isFinite(limit) && limit > 0 ? limit : 20,
    windowSec: 60,
  });

  return {
    store,
    translator,
    lyrics: compositeLyrics(),
    video: youtubeVideo,
    notifier,
    clock: systemClock,
    idGen: newId,
    rateLimit,
  };
};

export const getRedisForRuntime = getRedis;
