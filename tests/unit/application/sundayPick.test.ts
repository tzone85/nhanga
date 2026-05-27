import { describe, it, expect, vi } from "vitest";
import { sundayPick } from "@application/sundayPick";
import type { ProgressStore } from "@ports/progressStore";

describe("sundayPick orchestration", () => {
  it("picks song, creates lesson, fires notification", async () => {
    const songs = [{ id: "s1", title: "X", artist: "Y", lines: [], addedAt: "2026-05-01" }];
    const store = {
      listSongs: vi.fn().mockResolvedValue(songs),
      listAttempts: vi.fn().mockResolvedValue([]),
      listLessons: vi.fn().mockResolvedValue([]),
      createLesson: vi.fn().mockResolvedValue(undefined)
    };
    const notifier = { notify: vi.fn().mockResolvedValue(undefined) };
    const clock = { now: () => new Date("2026-05-24T07:00:00Z") };

    await sundayPick({
      store: store as unknown as ProgressStore,
      notifier,
      clock,
      idGen: () => "L1"
    });

    expect(store.createLesson).toHaveBeenCalledWith(
      expect.objectContaining({ songId: "s1", weekIso: "2026-W21" })
    );
    expect(notifier.notify).toHaveBeenCalledWith(
      expect.objectContaining({ url: "/quiz/L1" })
    );
  });
});
