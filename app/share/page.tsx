import { redirect } from "next/navigation";
import { headers } from "next/headers";

export default async function SharePage({ searchParams }: { searchParams: Promise<{ url?: string; text?: string }> }) {
  const { url, text } = await searchParams;
  const href = url ?? text;
  if (!href) return <main className="p-6">No URL shared.</main>;

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const res = await fetch(`${origin}/api/songs`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url: href }),
    cache: "no-store"
  });
  if (!res.ok) return <main className="p-6">Could not ingest. Try /add.</main>;
  const { data } = await res.json() as { data: { id: string } };
  redirect(`/learn/${data.id}`);
}
