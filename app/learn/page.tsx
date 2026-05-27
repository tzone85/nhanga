import Link from "next/link";
import { compose } from "@/src/composition";

export const dynamic = "force-dynamic";

export default async function LearnPage() {
  const { store } = compose();
  const songs = await store.listSongs();
  return (
    <main className="max-w-3xl mx-auto p-6">
      <h1 className="font-[family-name:var(--font-fraunces)] text-4xl text-[var(--color-shavi)] mb-6">
        Library
      </h1>
      <ul className="space-y-3">
        {songs.map((s) => (
          <li key={s.id}>
            <Link
              href={`/learn/${s.id}`}
              className="block p-4 bg-[var(--color-gora)]/[0.04] hover:bg-[var(--color-mwedzi)]/20 rounded-lg"
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
