import { NextResponse } from "next/server";
import { z } from "zod";
import { compose } from "@/src/composition";
import { addSong, type AddSongInput } from "@application/addSong";

const PostSchema = z.object({
  url: z.string().url().optional(),
  pastedLyrics: z.string().optional(),
  titleHint: z.string().optional(),
});

export async function GET() {
  const { store } = compose();
  return NextResponse.json({ data: await store.listSongs() });
}

export async function POST(req: Request) {
  const parsed = PostSchema.safeParse(await req.json());
  if (!parsed.success)
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  const input: AddSongInput = {
    ...(parsed.data.url !== undefined ? { url: parsed.data.url } : {}),
    ...(parsed.data.pastedLyrics !== undefined
      ? { pastedLyrics: parsed.data.pastedLyrics }
      : {}),
    ...(parsed.data.titleHint !== undefined
      ? { titleHint: parsed.data.titleHint }
      : {}),
  };
  const deps = compose();
  const song = await addSong(input, deps);
  return NextResponse.json({ data: song }, { status: 201 });
}
