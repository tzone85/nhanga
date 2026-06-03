export interface Gloss {
  readonly shonaToken: string;
  readonly englishGloss: string;
  readonly morphemes?: readonly string[];
}

export interface Line {
  readonly index: number;
  readonly shona: string;
  readonly english: string;
  readonly glosses: readonly Gloss[];
  readonly confidence: "draft" | "refined";
  readonly audioRange?: { readonly startMs: number; readonly endMs: number };
}

export interface Song {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly youtubeUrl?: string;
  readonly lines: readonly Line[];
  readonly addedAt: string;
  readonly lastQuizzedAt?: string;
}

export interface LinePatch {
  readonly english?: string;
  readonly glosses?: readonly Gloss[];
}

export const refineLine = (
  song: Song,
  index: number,
  patch: LinePatch,
): Song => {
  const target = song.lines[index];
  if (!target) throw new Error(`Line index ${index} out of range`);
  const updated: Line = { ...target, ...patch, confidence: "refined" };
  return {
    ...song,
    lines: song.lines.map((l, i) => (i === index ? updated : l)),
  };
};

export const splitShonaLines = (raw: string): readonly string[] =>
  raw
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
