import { describe, it, expect } from "vitest";
import { pickWeeklySong } from "@application/pickWeeklySong";
import type { Song } from "@domain/song";
import type { QuizAttempt } from "@domain/lesson";

const song = (id: string, addedAt: string): Song => ({
  id, title: id, artist: "x", lines: [], addedAt
});

describe("pickWeeklySong", () => {
  it("returns the oldest unseen song first", () => {
    const songs = [song("a","2026-05-01"), song("b","2026-04-01"), song("c","2026-06-01")];
    expect(pickWeeklySong(songs, []).id).toBe("b");
  });

  it("when all seen, returns song with lowest latest score", () => {
    const songs = [song("a","2026-05-01"), song("b","2026-04-01")];
    const attempts: QuizAttempt[] = [
      { id:"x", lessonId:"L-a", startedAt:"", items: [], finishedAt:"2026-05-20T00:00:00Z", score: 0.9 },
      { id:"y", lessonId:"L-b", startedAt:"", items: [], finishedAt:"2026-05-20T00:00:00Z", score: 0.5 }
    ];
    const lessons = new Map([["L-a","a"], ["L-b","b"]]);
    expect(pickWeeklySong(songs, attempts, lessons).id).toBe("b");
  });

  it("throws if songs is empty", () => {
    expect(() => pickWeeklySong([], [])).toThrow(/no songs/i);
  });
});
