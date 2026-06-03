import { describe, it, expect, vi } from "vitest";
import { addSong } from "@application/addSong";
import type { ProgressStore } from "@ports/progressStore";

describe("addSong", () => {
  it("composes video metadata, lyrics, and translation into a draft Song", async () => {
    const video = {
      fetchMetadata: vi
        .fn()
        .mockResolvedValue({ title: "Ndakuvara", authorName: "Jah Prayzah" }),
    };
    const lyrics = {
      fetch: vi.fn().mockResolvedValue("Ndakuvara\nMwoyo wangu"),
    };
    const translator = {
      draft: vi.fn().mockResolvedValue({
        lines: [
          { shona: "Ndakuvara", english: "I am hurt (draft)", glosses: [] },
          { shona: "Mwoyo wangu", english: "My heart (draft)", glosses: [] },
        ],
      }),
    };
    const store = { upsertSong: vi.fn().mockResolvedValue(undefined) };
    const clock = { now: () => new Date("2026-05-27T10:00:00Z") };

    const result = await addSong(
      { url: "https://youtu.be/abc" },
      {
        video,
        lyrics,
        translator,
        store: store as unknown as ProgressStore,
        clock,
        idGen: () => "s1",
      },
    );

    expect(result.translated).toBe(true);
    expect(result.song.id).toBe("s1");
    expect(result.song.title).toBe("Ndakuvara");
    expect(result.song.artist).toBe("Jah Prayzah");
    expect(result.song.youtubeUrl).toBe("https://youtu.be/abc");
    expect(result.song.lines).toHaveLength(2);
    expect(result.song.lines[0]?.confidence).toBe("draft");
    expect(store.upsertSong).toHaveBeenCalledWith(result.song);
  });

  it("when lyrics fetch returns null, creates the song with no lines (no translator call)", async () => {
    const video = {
      fetchMetadata: vi.fn().mockResolvedValue({ title: "X", authorName: "Y" }),
    };
    const lyrics = { fetch: vi.fn().mockResolvedValue(null) };
    const translator = { draft: vi.fn() };
    const store = { upsertSong: vi.fn().mockResolvedValue(undefined) };
    const clock = { now: () => new Date() };

    const result = await addSong(
      { url: "https://youtu.be/xyz" },
      {
        video,
        lyrics,
        translator,
        store: store as unknown as ProgressStore,
        clock,
        idGen: () => "s2",
      },
    );
    expect(result.song.lines).toEqual([]);
    expect(result.translated).toBe(true);
    expect(translator.draft).not.toHaveBeenCalled();
  });

  it("falls back to Shona-only lines when translator throws on pasted lyrics", async () => {
    const video = {
      fetchMetadata: vi.fn().mockResolvedValue({ title: "T", authorName: "A" }),
    };
    const lyrics = { fetch: vi.fn() };
    const translator = {
      draft: vi.fn().mockRejectedValue(new Error("quota exceeded")),
    };
    const store = { upsertSong: vi.fn().mockResolvedValue(undefined) };
    const clock = { now: () => new Date() };

    const result = await addSong(
      {
        url: "https://youtu.be/abc",
        pastedLyrics: "Nhasi\nMwari anewe",
      },
      {
        video,
        lyrics,
        translator,
        store: store as unknown as ProgressStore,
        clock,
        idGen: () => "s3",
      },
    );
    expect(result.translated).toBe(false);
    expect(result.reason).toMatch(/quota/);
    expect(result.song.lines).toHaveLength(2);
    expect(result.song.lines[0]?.english).toBe("");
  });
});
