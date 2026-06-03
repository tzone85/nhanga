import { NextResponse } from "next/server";
import { z } from "zod";
import { compose } from "@/src/composition";
import { addSong, type AddSongInput } from "@application/addSong";
import { isAllowedYouTubeUrl } from "@infra/urlAllowlist";
import { clientIpFromHeaders } from "@infra/rateLimit";
import { apiError, handleUnexpected } from "@infra/apiError";

const PostSchema = z
  .object({
    url: z.string().url().optional(),
    pastedLyrics: z.string().min(1).max(20_000).optional(),
    titleHint: z.string().min(1).max(200).optional(),
  })
  .refine((v) => v.url || v.pastedLyrics, {
    message: "Either url or pastedLyrics is required",
  });

export async function GET() {
  try {
    const { store } = compose();
    return NextResponse.json({ data: await store.listSongs() });
  } catch (err) {
    return handleUnexpected(err, "songs.list");
  }
}

export async function POST(req: Request) {
  try {
    const deps = compose();
    const ip = clientIpFromHeaders(req.headers);
    const decision = await deps.rateLimit(`songs:post:${ip}`);
    if (!decision.allowed) {
      return apiError("RATE_LIMITED", "too many requests", 429, {
        retryAfterMs: decision.resetAt - Date.now(),
      });
    }
    const json = await req.json().catch(() => null);
    if (json === null) return apiError("BAD_JSON", "invalid JSON body", 400);
    const parsed = PostSchema.safeParse(json);
    if (!parsed.success) {
      return apiError("INVALID_INPUT", "invalid input", 400, {
        issues: parsed.error.flatten(),
      });
    }
    if (parsed.data.url && !isAllowedYouTubeUrl(parsed.data.url)) {
      return apiError("URL_NOT_ALLOWED", "only YouTube URLs are accepted", 400);
    }
    const input: AddSongInput = {
      ...(parsed.data.url !== undefined ? { url: parsed.data.url } : {}),
      ...(parsed.data.pastedLyrics !== undefined
        ? { pastedLyrics: parsed.data.pastedLyrics }
        : {}),
      ...(parsed.data.titleHint !== undefined
        ? { titleHint: parsed.data.titleHint }
        : {}),
    };
    const result = await addSong(input, deps);
    return NextResponse.json(
      {
        data: result.song,
        translated: result.translated,
        ...(result.reason !== undefined ? { reason: result.reason } : {}),
      },
      { status: 201 },
    );
  } catch (err) {
    return handleUnexpected(err, "songs.post");
  }
}
