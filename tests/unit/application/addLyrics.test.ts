import { describe, it, expect, vi } from "vitest";
import { addLyrics } from "@application/addLyrics";
import type { ProgressStore } from "@ports/progressStore";
import type { Song } from "@domain/song";

const baseSong: Song = {
  id: "s1",
  title: "Nhasi",
  artist: "Nyasha David",
  youtubeUrl: "https://youtu.be/abc",
  lines: [],
  addedAt: "2026-06-01T00:00:00Z",
};

describe("addLyrics", () => {
  it("translates pasted lyrics and updates the song", async () => {
    const store = {
      getSong: vi.fn().mockResolvedValue(baseSong),
      upsertSong: vi.fn().mockResolvedValue(undefined),
    };
    const translator = {
      draft: vi.fn().mockResolvedValue({
        lines: [
          { shona: "Nhasi ndafara", english: "Today I am happy", glosses: [] },
        ],
      }),
    };

    const result = await addLyrics("s1", "Nhasi ndafara", {
      store: store as unknown as ProgressStore,
      translator,
    });

    expect(result.lines).toHaveLength(1);
    expect(result.lines[0]?.shona).toBe("Nhasi ndafara");
    expect(result.lines[0]?.confidence).toBe("draft");
    expect(translator.draft).toHaveBeenCalledWith("Nhasi ndafara");
    expect(store.upsertSong).toHaveBeenCalledWith(result);
  });

  it("throws if song not found", async () => {
    const store = {
      getSong: vi.fn().mockResolvedValue(null),
      upsertSong: vi.fn(),
    };
    const translator = { draft: vi.fn() };

    await expect(
      addLyrics("missing", "lyrics", {
        store: store as unknown as ProgressStore,
        translator,
      }),
    ).rejects.toThrow("Song missing not found");
  });

  it("throws if song already has lines", async () => {
    const songWithLines: Song = {
      ...baseSong,
      lines: [
        { index: 0, shona: "x", english: "y", glosses: [], confidence: "draft" },
      ],
    };
    const store = {
      getSong: vi.fn().mockResolvedValue(songWithLines),
      upsertSong: vi.fn(),
    };
    const translator = { draft: vi.fn() };

    await expect(
      addLyrics("s1", "new lyrics", {
        store: store as unknown as ProgressStore,
        translator,
      }),
    ).rejects.toThrow("already has lines");
  });
});
