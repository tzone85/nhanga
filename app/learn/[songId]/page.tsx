import { compose } from "@/src/composition";
import { SongEditor } from "./SongEditor";

export default async function SongPage({ params }: { params: Promise<{ songId: string }> }) {
  const { songId } = await params;
  const { store } = compose();
  const song = await store.getSong(songId);
  if (!song) return <main className="p-6">Song not found.</main>;
  return <SongEditor song={song} />;
}
