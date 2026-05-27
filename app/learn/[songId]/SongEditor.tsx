"use client";
import { useState } from "react";
import type { Song } from "@domain/song";
import { LineEditor } from "@ui/components/LineEditor";

const extractYouTubeId = (url: string): string | null => {
  try {
    const u = new URL(url);
    const v = u.searchParams.get("v");
    if (v) return v;
    const last = u.pathname.split("/").filter(Boolean).pop();
    return last ?? null;
  } catch {
    return null;
  }
};

export const SongEditor = ({ song: initial }: { song: Song }) => {
  const [song, setSong] = useState(initial);

  const save = async (lineIndex: number, english: string) => {
    const res = await fetch(`/api/songs/${song.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lineIndex, english })
    });
    if (!res.ok) return;
    setSong(s => ({
      ...s,
      lines: s.lines.map((l, i) => i === lineIndex ? { ...l, english, confidence: "refined" as const } : l)
    }));
  };

  const ytId = song.youtubeUrl ? extractYouTubeId(song.youtubeUrl) : null;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl text-[var(--color-shavi)]">{song.title}</h1>
        <p className="opacity-70">{song.artist}</p>
        {ytId && (
          <iframe
            className="w-full aspect-video mt-4 rounded-lg"
            src={`https://www.youtube.com/embed/${ytId}`}
            allow="encrypted-media"
            title={`${song.title} by ${song.artist}`}
          />
        )}
      </header>
      {song.lines.map(l => (
        <LineEditor key={l.index} line={l} onSave={(eng) => save(l.index, eng)} />
      ))}
    </main>
  );
};
