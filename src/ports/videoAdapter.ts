export interface VideoMetadata {
  readonly title: string;
  readonly authorName: string;
  readonly thumbnailUrl?: string;
  readonly durationSec?: number;
}
export interface VideoAdapter { fetchMetadata(url: string): Promise<VideoMetadata>; }
