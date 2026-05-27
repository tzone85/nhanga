import { describe, it, expect, vi } from "vitest";
import { makeWebPushNotifier } from "@infra/push.webpush";

describe("webPushNotifier", () => {
  it("sends to each stored subscription", async () => {
    const sendNotification = vi.fn().mockResolvedValue(undefined);
    const subs = [
      { endpoint: "https://a.example", keys: { p256dh: "x", auth: "y" } },
      { endpoint: "https://b.example", keys: { p256dh: "x", auth: "y" } }
    ];
    const notifier = makeWebPushNotifier({ getSubscriptions: async () => subs, sendNotification });
    await notifier.notify({ title: "Today's Nhanga", body: "Ndakuvara", url: "/quiz/L1" });
    expect(sendNotification).toHaveBeenCalledTimes(2);
  });
});
