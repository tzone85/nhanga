import { describe, it, expect } from "vitest";
import { makeKvStore } from "@infra/store.kv";
import type { Song } from "@domain/song";
import type { Lesson, QuizAttempt } from "@domain/lesson";
import type { SrsCard } from "@domain/srs";

class FakeRedis {
  private m = new Map<string, string>();
  async get<T>(k: string): Promise<T | null> {
    return this.m.has(k) ? (JSON.parse(this.m.get(k)!) as T) : null;
  }
  async set(k: string, v: unknown) {
    this.m.set(k, JSON.stringify(v));
  }
  async sadd(k: string, v: string) {
    const set = new Set(
      this.m.has(k) ? (JSON.parse(this.m.get(k)!) as string[]) : [],
    );
    set.add(v);
    this.m.set(k, JSON.stringify([...set]));
  }
  async smembers(k: string): Promise<string[]> {
    return this.m.has(k) ? (JSON.parse(this.m.get(k)!) as string[]) : [];
  }
}

const r = () => new FakeRedis() as unknown as import("@upstash/redis").Redis;
const song = (id: string): Song => ({
  id,
  title: id,
  artist: "x",
  lines: [],
  addedAt: "2026-05-27T00:00:00Z",
});
const lesson = (id: string, songId: string): Lesson => ({
  id,
  songId,
  weekIso: "2026-W22",
  createdAt: "2026-05-27T00:00:00Z",
  passScore: 0.8,
});
const attempt = (id: string, lessonId: string): QuizAttempt => ({
  id,
  lessonId,
  startedAt: "2026-05-27T00:00:00Z",
  items: [],
  score: 1,
});
const card = (id: string): SrsCard => ({
  id,
  kind: "line",
  ease: 2.5,
  intervalDays: 1,
  dueAt: "2026-05-28T00:00:00Z",
  lapses: 0,
});

describe("kvStore", () => {
  it("upsertSong + listSongs round-trip", async () => {
    const store = makeKvStore(r());
    await store.upsertSong(song("a"));
    await store.upsertSong(song("b"));
    expect((await store.listSongs()).map((s) => s.id).sort()).toEqual(["a", "b"]);
  });

  it("getSong returns null for missing id", async () => {
    const store = makeKvStore(r());
    expect(await store.getSong("nope")).toBeNull();
  });

  it("getSong returns the upserted song", async () => {
    const store = makeKvStore(r());
    await store.upsertSong(song("z"));
    expect((await store.getSong("z"))?.id).toBe("z");
  });

  it("createLesson + listLessons round-trip", async () => {
    const store = makeKvStore(r());
    await store.createLesson(lesson("l1", "s1"));
    expect((await store.listLessons()).map((l) => l.id)).toEqual(["l1"]);
  });

  it("recordAttempt + listAttempts round-trip", async () => {
    const store = makeKvStore(r());
    await store.recordAttempt(attempt("a1", "l1"));
    expect((await store.listAttempts()).map((a) => a.id)).toEqual(["a1"]);
  });

  it("upsertCards + listCards round-trip", async () => {
    const store = makeKvStore(r());
    await store.upsertCards([card("c1"), card("c2")]);
    expect((await store.listCards()).map((c) => c.id).sort()).toEqual(["c1", "c2"]);
  });
});
