const YT_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtu.be",
]);

export const isAllowedYouTubeUrl = (raw: string): boolean => {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:" && u.protocol !== "http:") return false;
  return YT_HOSTS.has(u.hostname.toLowerCase());
};

const PUSH_HOST_SUFFIXES: readonly string[] = [
  "push.services.mozilla.com", // Firefox (e.g. updates.push.services.mozilla.com)
  "fcm.googleapis.com", // Chromium / Android
  "android.googleapis.com", // legacy GCM still in some subscriptions
  "web.push.apple.com", // Safari / iOS
  "push.apple.com", // Apple push (older path)
  "notify.windows.com", // Edge / Windows (e.g. db5p.notify.windows.com)
];

export const isAllowedPushEndpoint = (raw: string): boolean => {
  let u: URL;
  try {
    u = new URL(raw);
  } catch {
    return false;
  }
  if (u.protocol !== "https:") return false;
  const host = u.hostname.toLowerCase();
  return PUSH_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
};
