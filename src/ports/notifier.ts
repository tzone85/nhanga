export interface Notification {
  readonly title: string;
  readonly body: string;
  readonly url: string;
}
export interface Notifier { notify(n: Notification): Promise<void>; }
