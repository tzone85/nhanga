"use client";
import { useEffect, useRef, useState } from "react";
import type { Line } from "@domain/song";
import { Button } from "./Button";

interface Props {
  line: Line;
  onSave: (english: string) => Promise<void>;
}

const autoSize = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = "auto";
  el.style.height = `${el.scrollHeight}px`;
};

export const LineEditor = ({ line, onSave }: Props) => {
  const [val, setVal] = useState(line.english);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const dirty = val !== line.english;

  useEffect(() => {
    autoSize(ref.current);
  }, [val]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 py-3 border-b border-[var(--color-foreground)]/10 items-start">
      <p className="font-[family-name:var(--font-fraunces)] text-lg text-[var(--color-heading)] whitespace-pre-wrap break-words">
        {line.shona}
      </p>
      <div className="flex gap-2 items-start">
        <textarea
          ref={ref}
          aria-label={`English for line ${line.index + 1}`}
          placeholder="English translation"
          rows={1}
          className="flex-1 bg-transparent border-b border-[var(--color-foreground)]/30 px-1 py-1 focus:outline-none focus:border-[var(--color-accent)] resize-none overflow-hidden whitespace-pre-wrap break-words"
          value={val}
          onChange={(e) => setVal(e.target.value)}
        />
        {dirty && (
          <Button
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              await onSave(val);
              setSaving(false);
            }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        )}
        {!dirty && line.confidence === "refined" && (
          <span
            className="text-[var(--color-success)] self-center"
            aria-label="refined"
          >
            ✓
          </span>
        )}
      </div>
    </div>
  );
};
