import type { Redis } from "@upstash/redis";
import type { ProgressStore } from "@ports/progressStore";
import type { Song } from "@domain/song";
import type { Lesson, QuizAttempt } from "@domain/lesson";
import type { SrsCard } from "@domain/srs";

const K = {
  song: (id: string) => `song:${id}`,
  songsIndex: "songs:index",
  lesson: (id: string) => `lesson:${id}`,
  lessonsIndex: "lessons:index",
  attempt: (id: string) => `attempt:${id}`,
  attemptsIndex: "attempts:index",
  card: (id: string) => `card:${id}`,
  cardsIndex: "cards:index"
};

export const makeKvStore = (redis: Redis): ProgressStore => ({
  async listSongs() {
    const ids = await redis.smembers(K.songsIndex);
    const xs = await Promise.all(ids.map(id => redis.get<Song>(K.song(id))));
    return xs.filter((x): x is Song => x !== null);
  },
  async getSong(id) { return await redis.get<Song>(K.song(id)); },
  async upsertSong(s) {
    await Promise.all([redis.set(K.song(s.id), s), redis.sadd(K.songsIndex, s.id)]);
  },
  async listLessons() {
    const ids = await redis.smembers(K.lessonsIndex);
    const xs = await Promise.all(ids.map(id => redis.get<Lesson>(K.lesson(id))));
    return xs.filter((x): x is Lesson => x !== null);
  },
  async createLesson(l) {
    await Promise.all([redis.set(K.lesson(l.id), l), redis.sadd(K.lessonsIndex, l.id)]);
  },
  async recordAttempt(a) {
    await Promise.all([redis.set(K.attempt(a.id), a), redis.sadd(K.attemptsIndex, a.id)]);
  },
  async listAttempts() {
    const ids = await redis.smembers(K.attemptsIndex);
    const xs = await Promise.all(ids.map(id => redis.get<QuizAttempt>(K.attempt(id))));
    return xs.filter((x): x is QuizAttempt => x !== null);
  },
  async listCards() {
    const ids = await redis.smembers(K.cardsIndex);
    const xs = await Promise.all(ids.map(id => redis.get<SrsCard>(K.card(id))));
    return xs.filter((x): x is SrsCard => x !== null);
  },
  async upsertCards(cards) {
    await Promise.all(cards.flatMap(c => [redis.set(K.card(c.id), c), redis.sadd(K.cardsIndex, c.id)]));
  }
});
