"use client";
import { useMemo, useState, type FormEvent } from "react";
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

interface LyricsResponse {
  data: Song;
  translated?: boolean;
  reason?: string;
}

interface ApiErrorBody {
  error?: string;
  code?: string;
  requestId?: string;
}

const LyricsPasteForm = ({
  songId,
  onDone,
}: {
  songId: string;
  onDone: (song: Song, translated: boolean, reason?: string) => void;
}) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const lyrics = (formData.get("lyrics") as string | null) ?? "";
    if (!lyrics.trim()) return;
    setBusy(true);
    setError("");
    let res: Response;
    try {
      res = await fetch(`/api/songs/${songId}/lyrics`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ shonaLyrics: lyrics }),
      });
    } catch {
      setError("Network error. Please check your connection and try again.");
      setBusy(false);
      return;
    }
    if (!res.ok) {
      let body: ApiErrorBody = {};
      try {
        body = (await res.json()) as ApiErrorBody;
      } catch {
        /* keep defaults */
      }
      const reqId = body.requestId ? ` (ref ${body.requestId})` : "";
      setError(`${body.error ?? "Something went wrong"}${reqId}`);
      setBusy(false);
      return;
    }
    const body = (await res.json()) as LyricsResponse;
    onDone(body.data, body.translated ?? true, body.reason);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 rounded-lg bg-[var(--color-mwedzi)]/10">
        <p className="font-medium text-[var(--color-shavi)]">No lyrics yet</p>
        <p className="text-sm opacity-70 mt-1">
          Lyrics couldn&apos;t be found automatically. Type or paste the Shona
          lyrics below and they&apos;ll be translated line by line. One line
          per row.
        </p>
      </div>
      <textarea
        name="lyrics"
        className="w-full bg-transparent border border-[var(--color-gora)]/30 rounded-lg p-3 focus:outline-none focus:border-[var(--color-mwedzi)] min-h-[200px]"
        placeholder={"Type or paste Shona lyrics here…"}
        required
        disabled={busy}
      />
      {error && <p className="text-red-600 text-sm">{error}</p>}
      <Button type="submit" disabled={busy}>
        {busy ? "Translating…" : "Add lyrics"}
      </Button>
    </form>
  );
};

const TranslationBanner = ({
  reason,
  onDismiss,
}: {
  reason: string | undefined;
  onDismiss: () => void;
}) => (
  <div
    role="alert"
    className="mb-4 p-4 rounded-lg border border-amber-400/40 bg-amber-50/70 text-sm"
  >
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="font-medium">Translation didn&apos;t run.</p>
        <p className="opacity-80 mt-1">
          Your lyrics are saved as Shona-only. Fill the English column inline
          to refine each line.
          {reason ? <span className="block mt-1 text-xs opacity-70">Reason: {reason}</span> : null}
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-xs underline opacity-70 hover:opacity-100"
        aria-label="Dismiss banner"
      >
        dismiss
      </button>
    </div>
  </div>
);

interface Props {
  song: Song;
  initialTranslated?: boolean;
  initialReason?: string;
}

export const SongEditor = ({
  song: initial,
  initialTranslated,
  initialReason,
}: Props) => {
  const [song, setSong] = useState(initial);
  const [translated, setTranslated] = useState<boolean>(
    initialTranslated ?? true,
  );
  const [reason, setReason] = useState<string | undefined>(initialReason);
  const [dismissed, setDismissed] = useState(false);

  const hasMissingEnglish = useMemo(
    () => song.lines.some((l) => l.english.trim() === ""),
    [song.lines],
  );
  const showBanner = !dismissed && (!translated || hasMissingEnglish);

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
            loading="lazy"
            title={`${song.title} by ${song.artist}`}
          />
        )}
      </header>
      {showBanner && (
        <TranslationBanner
          reason={reason}
          onDismiss={() => setDismissed(true)}
        />
      )}
      {(song.lines?.length ?? 0) === 0 ? (
        <LyricsPasteForm
          songId={song.id}
          onDone={(s, t, r) => {
            setSong(s);
            setTranslated(t);
            setReason(r);
            setDismissed(false);
          }}
        />
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
