import { describe, it, expect } from "vitest";
import { isAllowedYouTubeUrl } from "@infra/urlAllowlist";

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
