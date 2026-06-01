import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LineEditor } from "@ui/components/LineEditor";
import type { Line } from "@domain/song";

const line: Line = {
  index: 0,
  shona: "Mwari",
  english: "God",
  glosses: [],
  confidence: "draft",
};

describe("LineEditor", () => {
  it("shows the Save button only when the value is dirty", () => {
    const onSave = vi.fn(async () => {});
    render(<LineEditor line={line} onSave={onSave} />);
    expect(screen.queryByRole("button", { name: /save/i })).toBeNull();
    fireEvent.change(screen.getByLabelText(/English for line 1/), {
      target: { value: "Holy God" },
    });
    expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
  });

  it("calls onSave with the edited value", async () => {
    const onSave = vi.fn(async () => {});
    render(<LineEditor line={line} onSave={onSave} />);
    fireEvent.change(screen.getByLabelText(/English for line 1/), {
      target: { value: "Holy God" },
    });
    fireEvent.click(screen.getByRole("button", { name: /save/i }));
    await waitFor(() => expect(onSave).toHaveBeenCalledWith("Holy God"));
  });

  it("shows a refined check when not dirty and confidence is refined", () => {
    const refined: Line = { ...line, confidence: "refined" };
    render(<LineEditor line={refined} onSave={vi.fn()} />);
    expect(screen.getByLabelText("refined")).toBeInTheDocument();
  });
});
