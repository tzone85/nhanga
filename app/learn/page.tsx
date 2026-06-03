import Link from "next/link";
import { compose } from "@/src/composition";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const { store } = compose();
  const songs = await store.listSongs();
  return (
    <main className="max-w-3xl mx-auto p-6">
      <header className="flex items-end justify-between flex-wrap gap-4 mb-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-4xl text-[var(--color-heading)]">
          Library
        </h1>
        {songs.length > 0 && (
          <div className="flex gap-2 text-sm">
            <a
              href="/api/library/export?format=csv"
              className="px-3 py-1.5 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/5"
            >
              Download all (CSV)
            </a>
            <a
              href="/api/library/export?format=anki"
              className="px-3 py-1.5 rounded-md border border-[var(--color-foreground)]/20 hover:bg-[var(--color-foreground)]/5"
              title="Tab-separated file for Anki: File → Import"
            >
              All as Anki TSV
            </a>
          </div>
        )}
      </header>
      <ul className="space-y-3">
        {songs.map((s) => (
          <li key={s.id}>
            <Link
              href={`/learn/${s.id}`}
              className="block p-4 bg-[var(--color-foreground)]/[0.04] hover:bg-[var(--color-accent)]/15 rounded-lg"
            >
              <div className="font-medium">{s.title}</div>
              <div className="text-sm opacity-70">{s.artist}</div>
            </Link>
          </li>
        ))}
        {songs.length === 0 && (
          <li className="opacity-60">No songs yet. Share one from YouTube.</li>
        )}
      </ul>
    </main>
  );
}
