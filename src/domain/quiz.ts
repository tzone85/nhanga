import type { Line } from "@domain/song";

export interface ClozeItem {
  readonly english: string;
  readonly masked: string;
  readonly answer: string;
  readonly lineIndex: number;
}

export const makeCloze = (line: Line, lineIndex: number, tokenIndex: number): ClozeItem => {
  const tokens = line.shona.split(/\s+/);
  const target = tokens[tokenIndex];
  if (!target) throw new Error(`Token ${tokenIndex} out of range for line "${line.shona}"`);
  const masked = tokens
    .map((t, i) => (i === tokenIndex ? "_".repeat(Math.max(3, t.length)) : t))
    .join(" ");
  return { english: line.english, masked, answer: target, lineIndex };
};

const levenshtein = (a: string, b: string): number => {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp: number[] = Array(n + 1).fill(0).map((_, i) => i);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0]!;
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const tmp = dp[j]!;
      dp[j] = a[i - 1] === b[j - 1] ? prev : 1 + Math.min(prev, dp[j]!, dp[j - 1]!);
      prev = tmp;
    }
  }
  return dp[n]!;
};

export const gradeTranslate = (expected: string, given: string): boolean => {
  const e = expected.trim().toLowerCase();
  const g = given.trim().toLowerCase();
  if (e === g) return true;
  return levenshtein(e, g) <= 2;
};

export const splitMorphemes = (
  given: readonly string[],
  canonical: readonly string[]
): boolean => {
  if (given.length !== canonical.length) return false;
  return given.every((part, i) => part.toLowerCase() === canonical[i]?.toLowerCase());
};
