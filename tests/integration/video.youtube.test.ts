import { describe, it, expect } from "vitest";
import { http, HttpResponse } from "msw";
import { server } from "./msw";
import { youtubeVideo } from "@infra/video.youtube";

describe("youtubeVideo.fetchMetadata", () => {
  it("normalises oEmbed response", async () => {
    server.use(
      http.get("https://www.youtube.com/oembed", () =>
        HttpResponse.json({ title: "Ndakuvara", author_name: "Jah Prayzah", thumbnail_url: "https://i.ytimg.com/x.jpg" })
      )
    );
    const m = await youtubeVideo.fetchMetadata("https://youtu.be/abc");
    expect(m.title).toBe("Ndakuvara");
    expect(m.authorName).toBe("Jah Prayzah");
    expect(m.thumbnailUrl).toBe("https://i.ytimg.com/x.jpg");
  });

  it("throws on non-OK response", async () => {
    server.use(http.get("https://www.youtube.com/oembed", () => HttpResponse.text("nope", { status: 404 })));
    await expect(youtubeVideo.fetchMetadata("https://youtu.be/zzz")).rejects.toThrow(/youtube oembed/i);
  });
});
