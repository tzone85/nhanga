import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./msw";
import { compositeLyrics } from "@infra/lyrics.composite";

describe("compositeLyrics", () => {
  it("returns lyrics.ovh result when present", async () => {
    server.use(
      http.get("https://api.lyrics.ovh/v1/Jah%20Prayzah/Ndakuvara", () =>
        HttpResponse.json({ lyrics: "Ndakuvara\nMwoyo wangu" })
      )
    );
    const r = await compositeLyrics().fetch({ title: "Ndakuvara", artist: "Jah Prayzah" });
    expect(r).toContain("Ndakuvara");
  });

  it("returns null when no source has anything", async () => {
    server.use(
      http.get("https://api.lyrics.ovh/v1/*", () => HttpResponse.text("nope", { status: 404 }))
    );
    const r = await compositeLyrics().fetch({ title: "X", artist: "Y" });
    expect(r).toBeNull();
  });
});
