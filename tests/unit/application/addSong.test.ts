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

    const song = await addSong(
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

    expect(song.id).toBe("s1");
    expect(song.title).toBe("Ndakuvara");
    expect(song.artist).toBe("Jah Prayzah");
    expect(song.youtubeUrl).toBe("https://youtu.be/abc");
    expect(song.lines).toHaveLength(2);
    expect(song.lines[0]?.confidence).toBe("draft");
    expect(store.upsertSong).toHaveBeenCalledWith(song);
  });

  it("when lyrics fetch returns null, translates an empty draft (no lines)", async () => {
    const video = {
      fetchMetadata: vi.fn().mockResolvedValue({ title: "X", authorName: "Y" }),
    };
    const lyrics = { fetch: vi.fn().mockResolvedValue(null) };
    const translator = { draft: vi.fn().mockResolvedValue({ lines: [] }) };
    const store = { upsertSong: vi.fn().mockResolvedValue(undefined) };
    const clock = { now: () => new Date() };

    const song = await addSong(
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
    expect(song.lines).toEqual([]);
  });
});
