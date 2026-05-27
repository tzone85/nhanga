"use client";
import { useState } from "react";
import { Button } from "./Button";

interface Props {
  shona: string;
  onAnswer: (answer: string) => void;
}

export const QuizTranslate = ({ shona, onAnswer }: Props) => {
  const [val, setVal] = useState("");
  return (
    <div className="space-y-3" data-quiz-item>
      <div className="font-[family-name:var(--font-fraunces)] text-2xl text-[var(--color-shavi)]">{shona}</div>
      <textarea
        aria-label="English translation"
        className="w-full bg-transparent border border-[var(--color-gora)]/30 rounded-lg px-2 py-2 focus:outline-none focus:border-[var(--color-mwedzi)]"
        rows={3}
        value={val}
        onChange={e => setVal(e.target.value)}
      />
      <Button onClick={() => onAnswer(val)}>Submit</Button>
    </div>
  );
};
