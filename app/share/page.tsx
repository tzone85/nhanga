import { redirect } from "next/navigation";
import { compose } from "@/src/composition";
import { addSong } from "@application/addSong";
import { isAllowedYouTubeUrl } from "@infra/urlAllowlist";

const extractUrl = (s: string): string | null => {
  const m = s.match(/https?:\/\/\S+/);
  return m?.[0] ?? null;
};

export default async function SharePage({
  searchParams,
}: {
  searchParams: Promise<{ url?: string; text?: string; title?: string }>;
}) {
  const { url, text, title } = await searchParams;
  const candidate = url ?? (text ? extractUrl(text) : null);
  if (!candidate || !isAllowedYouTubeUrl(candidate)) {
    return (
      <main className="p-6">
        <h1 className="font-[family-name:var(--font-fraunces)] text-2xl mb-2">
          Can&apos;t use this share
        </h1>
        <p className="opacity-70">Only YouTube links are supported.</p>
      </main>
    );
  }

  const deps = compose();
  const song = await addSong(
    {
      url: candidate,
      ...(title ? { titleHint: title } : {}),
    },
    deps,
  );
  redirect(`/learn/${song.id}`);
}
