import type { Notifier, Notification } from "@ports/notifier";

export interface PushSubscriptionLike {
  readonly endpoint: string;
  readonly keys: { readonly p256dh: string; readonly auth: string };
}

export interface WebPushDeps {
  getSubscriptions(): Promise<readonly PushSubscriptionLike[]>;
  sendNotification(sub: PushSubscriptionLike, payload: string): Promise<unknown>;
}

export const makeWebPushNotifier = (deps: WebPushDeps): Notifier => ({
  async notify(n: Notification) {
    const subs = await deps.getSubscriptions();
    const payload = JSON.stringify(n);
    await Promise.allSettled(subs.map(s => deps.sendNotification(s, payload)));
  }
});
