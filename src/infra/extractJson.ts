const FENCE = /^\s*```(?:json)?\s*\n?([\s\S]*?)\n?\s*```\s*$/i;

const findBalancedObject = (s: string): string | null => {
  const start = s.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < s.length; i++) {
    const ch = s[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\") {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      continue;
    }
    if (inString) continue;
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return s.slice(start, i + 1);
    }
  }
  return null;
};

export const extractJsonObject = (raw: string): string | null => {
  const trimmed = raw.trim();
  const fenced = trimmed.match(FENCE);
  const body = (fenced?.[1] ?? trimmed).trim();
  if (body.startsWith("{") && body.endsWith("}")) {
    return body;
  }
  return findBalancedObject(body);
};
