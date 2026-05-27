import type { VideoAdapter, VideoMetadata } from "@ports/videoAdapter";

export const youtubeVideo: VideoAdapter = {
  async fetchMetadata(url: string): Promise<VideoMetadata> {
    const u = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const res = await fetch(u);
    if (!res.ok) throw new Error(`YouTube oEmbed failed: ${res.status}`);
    const data = (await res.json()) as { title: string; author_name: string; thumbnail_url?: string };
    return {
      title: data.title,
      authorName: data.author_name,
      ...(data.thumbnail_url ? { thumbnailUrl: data.thumbnail_url } : {})
    };
  }
};
