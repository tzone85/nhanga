"use client";
import { useState } from "react";
import { Button } from "./Button";

interface Props {
  english: string;
  masked: string;
  onAnswer: (answer: string) => void;
}

export const QuizCloze = ({ english, masked, onAnswer }: Props) => {
  const [val, setVal] = useState("");
  return (
    <div className="space-y-3" data-quiz-item>
      <div className="text-sm opacity-70">{english}</div>
      <div className="font-[family-name:var(--font-fraunces)] text-2xl">{masked}</div>
      <div className="flex gap-2">
        <input
          aria-label="Shona answer"
          className="flex-1 bg-transparent border-b border-[var(--color-gora)]/40 px-1 py-1"
          value={val}
          onChange={e => setVal(e.target.value)}
        />
        <Button onClick={() => onAnswer(val)}>Submit</Button>
      </div>
    </div>
  );
};
