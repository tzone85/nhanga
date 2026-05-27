import { describe, it, expect } from "vitest";
import { makeKvStore } from "@infra/store.kv";
import type { Song } from "@domain/song";

class FakeRedis {
  private m = new Map<string, string>();
  async get<T>(k: string): Promise<T | null> { return this.m.has(k) ? JSON.parse(this.m.get(k)!) as T : null; }
  async set(k: string, v: unknown) { this.m.set(k, JSON.stringify(v)); }
  async sadd(k: string, v: string) {
    const set = new Set(this.m.has(k) ? JSON.parse(this.m.get(k)!) as string[] : []);
    set.add(v);
    this.m.set(k, JSON.stringify([...set]));
  }
  async smembers(k: string): Promise<string[]> {
    return this.m.has(k) ? JSON.parse(this.m.get(k)!) as string[] : [];
  }
}

const song = (id: string): Song => ({ id, title: id, artist: "x", lines: [], addedAt: "2026-05-27T00:00:00Z" });

describe("kvStore", () => {
  it("upsertSong + listSongs round-trip", async () => {
    const store = makeKvStore(new FakeRedis() as unknown as import("@upstash/redis").Redis);
    await store.upsertSong(song("a"));
    await store.upsertSong(song("b"));
    const songs = await store.listSongs();
    expect(songs.map(s => s.id).sort()).toEqual(["a", "b"]);
  });

  it("getSong returns null for missing id", async () => {
    const store = makeKvStore(new FakeRedis() as unknown as import("@upstash/redis").Redis);
    expect(await store.getSong("nope")).toBeNull();
  });
});
