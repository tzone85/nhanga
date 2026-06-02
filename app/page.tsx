import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="max-w-xl text-center space-y-8">
        <div>
          <h1 className="font-[family-name:var(--font-fraunces)] text-6xl text-[var(--color-shavi)] mb-4">
            Nhanga
          </h1>
          <p className="text-lg text-[var(--color-gora)]/80">
            One song a week. Sunday quiz. Built to remember.
          </p>
        </div>

        <section className="text-left space-y-4 text-[var(--color-gora)]/70 text-sm">
          <h2 className="font-[family-name:var(--font-fraunces)] text-xl text-[var(--color-shavi)]">
            How it works
          </h2>
          <ol className="list-decimal list-inside space-y-2">
            <li>
              <strong>Add a song</strong> &mdash; paste a YouTube link or Shona
              lyrics and Nhanga creates a lesson.
            </li>
            <li>
              <strong>Learn line by line</strong> &mdash; read the lyrics, refine
              translations, and build familiarity.
            </li>
            <li>
              <strong>Quiz on Sunday</strong> &mdash; a spaced-repetition quiz
              tests you on lines you&apos;ve studied.
            </li>
          </ol>
        </section>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/add"
            className="inline-block px-6 py-3 rounded-lg bg-[var(--color-mwedzi)] text-[var(--color-shavi)] font-medium hover:opacity-90"
          >
            Add a song
          </Link>
          <Link
            href="/learn"
            className="inline-block px-6 py-3 rounded-lg border border-[var(--color-gora)]/20 text-[var(--color-gora)] hover:bg-[var(--color-gora)]/[0.04]"
          >
            Browse library
          </Link>
        </div>
      </div>
    </main>
  );
}
