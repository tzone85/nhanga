import { describe, it, expect } from "vitest";
import {
  isAllowedYouTubeUrl,
  isAllowedPushEndpoint,
} from "@infra/urlAllowlist";

describe("isAllowedYouTubeUrl", () => {
  it.each([
    "https://www.youtube.com/watch?v=abc",
    "https://m.youtube.com/watch?v=abc",
    "https://music.youtube.com/watch?v=abc",
    "https://youtu.be/abc",
    "https://youtube.com/watch?v=abc",
  ])("allows %s", (u) => {
    expect(isAllowedYouTubeUrl(u)).toBe(true);
  });

  it.each([
    "https://evil.example.com/watch?v=abc",
    "javascript:alert(1)",
    "file:///etc/passwd",
    "not a url",
    "https://youtube.com.evil.com/watch?v=abc",
  ])("rejects %s", (u) => {
    expect(isAllowedYouTubeUrl(u)).toBe(false);
  });
});

describe("isAllowedPushEndpoint", () => {
  it.each([
    "https://updates.push.services.mozilla.com/wpush/v2/abc",
    "https://fcm.googleapis.com/fcm/send/abc",
    "https://android.googleapis.com/gcm/send/abc",
    "https://web.push.apple.com/abc",
    "https://db5p.notify.windows.com/w/?token=abc",
  ])("allows real push endpoint %s", (u) => {
    expect(isAllowedPushEndpoint(u)).toBe(true);
  });

  it.each([
    "http://updates.push.services.mozilla.com/abc", // not https
    "https://169.254.169.254/latest/meta-data", // SSRF target
    "https://localhost/abc",
    "https://internal.corp/abc",
    "https://attacker.example.com/abc",
    "https://fcm.googleapis.com.evil.com/abc", // suffix bypass attempt
    "ftp://updates.push.services.mozilla.com/abc",
    "not a url",
  ])("rejects %s", (u) => {
    expect(isAllowedPushEndpoint(u)).toBe(false);
  });
});
