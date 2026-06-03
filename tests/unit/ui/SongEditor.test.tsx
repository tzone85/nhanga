import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { SongEditor } from "@/app/learn/[songId]/SongEditor";
import type { Song } from "@domain/song";

const songWithMissingEnglish: Song = {
  id: "01HSAMPLE0000000000000000A",
  title: "Neria",
  artist: "Oliver Mtukudzi",
  addedAt: "2026-05-27T00:00:00Z",
  lines: [
    { index: 0, shona: "Neria", english: "", glosses: [], confidence: "draft" },
    { index: 1, shona: "Usacheme Neria", english: "", glosses: [], confidence: "draft" },
  ],
};

const songFullyTranslated: Song = {
  ...songWithMissingEnglish,
  lines: songWithMissingEnglish.lines.map((l) => ({ ...l, english: "done" })),
};

describe("SongEditor", () => {
  it("shows the translation-fallback banner with reason when initialTranslated=false", () => {
    render(
      <SongEditor
        song={songWithMissingEnglish}
        initialTranslated={false}
        initialReason="quota exceeded"
      />,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(/Translation didn't run/);
    expect(alert).toHaveTextContent(/quota exceeded/);
  });

  it("shows the banner when any line is missing English, even without an initial reason", () => {
    render(<SongEditor song={songWithMissingEnglish} />);
    expect(screen.getByRole("alert")).toHaveTextContent(/Translation didn't run/);
  });

  it("hides the banner once dismissed", () => {
    render(<SongEditor song={songWithMissingEnglish} initialTranslated={false} />);
    fireEvent.click(screen.getByLabelText("Dismiss banner"));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("doesn't show the banner when all lines have English", () => {
    render(<SongEditor song={songFullyTranslated} initialTranslated={true} />);
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
