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
    <main className="max-w-2xl mx-auto p-6 space-y-4">
      <h1 className="font-[family-name:var(--font-fraunces)] text-3xl text-[var(--color-shavi)]">Add a song</h1>
      <input
        className="w-full bg-transparent border-b border-[var(--color-gora)]/30 py-1 focus:outline-none focus:border-[var(--color-mwedzi)]"
        placeholder="YouTube URL (optional)"
        value={url}
        onChange={e => setUrl(e.target.value)}
      />
      <input
        className="w-full bg-transparent border-b border-[var(--color-gora)]/30 py-1 focus:outline-none focus:border-[var(--color-mwedzi)]"
        placeholder="Title hint (optional)"
        value={title}
        onChange={e => setTitle(e.target.value)}
      />
      <textarea
        className="w-full bg-transparent border border-[var(--color-gora)]/30 rounded-lg p-2 focus:outline-none focus:border-[var(--color-mwedzi)]"
        rows={10}
        placeholder="Paste Shona lyrics (optional)"
        value={lyrics}
        onChange={e => setLyrics(e.target.value)}
      />
      <Button onClick={submit} disabled={busy}>{busy ? "Adding…" : "Add"}</Button>
    </main>
  );
}
