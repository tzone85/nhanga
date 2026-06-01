import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuizCloze } from "@ui/components/QuizCloze";

describe("QuizCloze", () => {
  it("reports the typed answer to onAnswer", () => {
    const onAnswer = vi.fn();
    render(<QuizCloze english="I am hurt" masked="___ wangu" onAnswer={onAnswer} />);
    fireEvent.change(screen.getByLabelText("Shona answer"), { target: { value: "Mwoyo" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(onAnswer).toHaveBeenCalledWith("Mwoyo");
  });
});
