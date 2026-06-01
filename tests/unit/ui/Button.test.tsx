import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@ui/components/Button";

describe("Button", () => {
  it("renders as a button element with provided children", () => {
    render(<Button>Save</Button>);
    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("fires onClick", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("applies ghost variant classes when requested", () => {
    render(<Button variant="ghost">G</Button>);
    expect(screen.getByRole("button").className).toMatch(/bg-transparent/);
  });
});
