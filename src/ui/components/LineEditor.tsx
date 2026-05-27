"use client";
import { useState } from "react";
import type { Line } from "@domain/song";
import { Button } from "./Button";

interface Props {
  line: Line;
  onSave: (english: string) => Promise<void>;
}

export const LineEditor = ({ line, onSave }: Props) => {
  const [val, setVal] = useState(line.english);
  const [saving, setSaving] = useState(false);
  const dirty = val !== line.english;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-3 border-b border-[var(--color-gora)]/10">
      <div className="font-[family-name:var(--font-fraunces)] text-lg text-[var(--color-shavi)]">
        {line.shona}
      </div>
      <div className="flex gap-2">
        <input
          aria-label={`English for line ${line.index + 1}`}
          className="flex-1 bg-transparent border-b border-[var(--color-gora)]/30 px-1 py-1 focus:outline-none focus:border-[var(--color-mwedzi)]"
          value={val}
          onChange={e => setVal(e.target.value)}
        />
        {dirty && (
          <Button disabled={saving} onClick={async () => { setSaving(true); await onSave(val); setSaving(false); }}>
            {saving ? "Saving…" : "Save"}
          </Button>
        )}
        {!dirty && line.confidence === "refined" && (
          <span className="text-[var(--color-ruwa)] self-center" aria-label="refined">✓</span>
        )}
      </div>
    </div>
  );
};
