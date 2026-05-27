export interface LyricsLookup { readonly title: string; readonly artist?: string; }
export interface LyricsSource { fetch(q: LyricsLookup): Promise<string | null>; }
