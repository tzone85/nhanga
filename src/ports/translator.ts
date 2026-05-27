import type { Gloss } from "@domain/song";
export interface TranslationDraft {
  readonly lines: readonly { readonly shona: string; readonly english: string; readonly glosses: readonly Gloss[] }[];
}
export interface Translator {
  draft(shonaLyrics: string): Promise<TranslationDraft>;
}
