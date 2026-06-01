import { describe, it, expect } from "vitest";
import { refineLine } from "@application/refineLine";
import type { Song } from "@domain/song";
import type { ProgressStore } from "@ports/progressStore";

const baseSong: Song = {
  id: "s1",
  title: "T",
  artist: "A",
  addedAt: "2026-05-27T00:00:00.000Z",
  lines: [
    { index: 0, shona: "Mwari", english: "God", glosses: [], confidence: "draft" },
  ],
};

const fakeStore = (initial: Song | null) => {
  let current = initial;
  const calls: Song[] = [];
  return {
    store: {
      listSongs: async () => (current ? [current] : []),
      getSong: async () => current,
      upsertSong: async (s: Song) => {
        current = s;
        calls.push(s);
      },
      listLessons: async () => [],
      createLesson: async () => {},
      recordAttempt: async () => {},
      listAttempts: async () => [],
      listCards: async () => [],
      upsertCards: async () => {},
    } satisfies ProgressStore,
    calls,
  };
};

describe("application.refineLine", () => {
  it("persists a refined line", async () => {
    const { store, calls } = fakeStore(baseSong);
    await refineLine("s1", 0, { english: "Holy God" }, { store });
    expect(calls).toHaveLength(1);
    expect(calls[0]!.lines[0]!.english).toBe("Holy God");
    expect(calls[0]!.lines[0]!.confidence).toBe("refined");
  });

  it("throws when the song is missing", async () => {
    const { store } = fakeStore(null);
    await expect(
      refineLine("nope", 0, { english: "x" }, { store }),
    ).rejects.toThrow(/not found/);
  });
});
