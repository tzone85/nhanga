"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@ui/components/Button";

export default function AddPage() {
  const [url, setUrl] = useState("");
  const [lyrics, setLyrics] = useState("");
  const [title, setTitle] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  const submit = async () => {
    setBusy(true);
    const res = await fetch("/api/songs", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        ...(url ? { url } : {}),
        ...(lyrics ? { pastedLyrics: lyrics } : {}),
        ...(title ? { titleHint: title } : {})
      })
    });
    if (!res.ok) { setBusy(false); return; }
    const { data } = await res.json() as { data: { id: string } };
    router.push(`/learn/${data.id}`);
  };

  return (
    <main className="max-w-2xl mx-auto p-6 space-y-6">
      <div>
        <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--color-shavi)]">Add a song</h1>
        <p className="text-sm text-[var(--color-gora)]/70 mt-1">
          Add a YouTube link, type or paste Shona lyrics, or both. Lyrics will be translated line by line.
        </p>
      </div>
      <input
        className="w-full bg-transparent border-b border-[var(--color-gora)]/30 py-1 focus:outline-none focus:border-[var(--color-mwedzi)]"
        placeholder="YouTube URL (optional)"
        value={url}
        onChange={e => setUrl(e.target.value)}
      />
      <input
        className="w-full bg-transparent border-b border-[var(--color-gora)]/30 py-1 focus:outline-none focus:border-[var(--color-mwedzi)]"
        placeholder="Song title (optional if YouTube URL is provided)"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <div>
        <label className="block text-sm font-medium text-[var(--color-gora)]/80 mb-1">
          Shona lyrics
        </label>
        <textarea
          className="w-full bg-transparent border border-[var(--color-gora)]/30 rounded-lg p-2 focus:outline-none focus:border-[var(--color-mwedzi)]"
          rows={10}
          placeholder={"Type or paste Shona lyrics here\u2026"}
          value={lyrics}
          onChange={e => setLyrics(e.target.value)}
        />
        <p className="text-xs text-[var(--color-gora)]/50 mt-1">
          If left empty, Nhanga will try to find lyrics automatically (this often fails for Shona songs).
        </p>
      </div>
      <Button onClick={submit} disabled={busy}>{busy ? "Adding\u2026" : "Add song"}</Button>
    </main>
  );
}
