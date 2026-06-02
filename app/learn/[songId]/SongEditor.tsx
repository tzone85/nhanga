"use client";
import { useState } from "react";
import type { Song } from "@domain/song";
import { LineEditor } from "@ui/components/LineEditor";
import { Button } from "@ui/components/Button";

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

const LyricsPasteForm = ({
  songId,
  onDone,
}: {
  songId: string;
  onDone: (song: Song) => void;
}) => {
  const [lyrics, setLyrics] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!lyrics.trim()) return;
    setBusy(true);
    setError("");
    const res = await fetch(`/api/songs/${songId}/lyrics`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ shonaLyrics: lyrics }),
    });
    if (!res.ok) {
      setError("Something went wrong. Please try again.");
      setBusy(false);
      return;
    }
    const { data } = (await res.json()) as { data: Song };
    onDone(data);
  };

  return (
    <section className="space-y-4">
      <div className="p-4 rounded-lg bg-[var(--color-mwedzi)]/10">
        <p className="font-medium text-[var(--color-shavi)]">No lyrics yet</p>
        <p className="text-sm opacity-70 mt-1">
          Lyrics couldn&apos;t be found automatically. Type or paste the Shona
          lyrics below and they&apos;ll be translated line by line.
        </p>
      </div>
      <textarea
        className="w-full bg-transparent border border-[var(--color-gora)]/30 rounded-lg p-3 focus:outline-none focus:border-[var(--color-mwedzi)] min-h-[200px]"
        placeholder={"Type or paste Shona lyrics here\u2026"}
        value={lyrics}
        onChange={(e) => setLyrics(e.target.value)}
        disabled={busy}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button onClick={submit} disabled={busy || !lyrics.trim()}>
        {busy ? "Translating\u2026" : "Add lyrics"}
      </Button>
    </section>
  );
};

export const SongEditor = ({ song: initial }: { song: Song }) => {
  const [song, setSong] = useState(initial);

  const save = async (lineIndex: number, english: string) => {
    const res = await fetch(`/api/songs/${song.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ lineIndex, english }),
    });
    if (!res.ok) return;
    setSong((s) => ({
      ...s,
      lines: s.lines.map((l, i) =>
        i === lineIndex
          ? { ...l, english, confidence: "refined" as const }
          : l,
      ),
    }));
  };

  const ytId = song.youtubeUrl ? extractYouTubeId(song.youtubeUrl) : null;

  return (
    <main className="max-w-3xl mx-auto p-6">
      <header className="mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl text-[var(--color-shavi)]">
          {song.title}
        </h1>
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
      {song.lines.length === 0 ? (
        <LyricsPasteForm songId={song.id} onDone={setSong} />
      ) : (
        song.lines.map((l) => (
          <LineEditor
            key={l.index}
            line={l}
            onSave={(eng) => save(l.index, eng)}
          />
        ))
      )}
    </main>
  );
};
