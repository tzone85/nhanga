import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { QuizTranslate } from "@ui/components/QuizTranslate";

describe("QuizTranslate", () => {
  it("reports the typed translation", () => {
    const onAnswer = vi.fn();
    render(<QuizTranslate shona="Ndakuvara" onAnswer={onAnswer} />);
    fireEvent.change(screen.getByLabelText("English translation"), { target: { value: "I am hurt" } });
    fireEvent.click(screen.getByRole("button", { name: /submit/i }));
    expect(onAnswer).toHaveBeenCalledWith("I am hurt");
  });
});
