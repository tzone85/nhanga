import { readFile } from "node:fs/promises";
import { compose } from "../src/composition";

const main = async () => {
  const raw = await readFile(new URL("../seed/songs.json", import.meta.url), "utf8");
  const songs = JSON.parse(raw) as {
    title: string;
    artist: string;
    youtubeUrl?: string;
    lines: { shona: string; english: string }[];
  }[];
  const { store, idGen, clock } = compose();
  for (const s of songs) {
    await store.upsertSong({
      id: idGen(),
      title: s.title,
      artist: s.artist,
      ...(s.youtubeUrl ? { youtubeUrl: s.youtubeUrl } : {}),
      lines: s.lines.map((l, i) => ({
        index: i,
        shona: l.shona,
        english: l.english,
        glosses: [],
        confidence: "refined" as const
      })),
      addedAt: clock.now().toISOString()
    });
  }
  process.stderr.write(`Seeded ${songs.length} songs\n`);
};

main().catch(e => { process.stderr.write(String(e) + "\n"); process.exit(1); });
