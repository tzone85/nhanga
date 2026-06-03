import { type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "ghost" | "secondary";
type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

const BASE =
  "px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

const VARIANTS: Record<Variant, string> = {
  primary:
    "bg-[var(--color-heading)] text-[var(--color-background)] hover:bg-[var(--color-foreground)]",
  secondary:
    "bg-[var(--color-accent)] text-[var(--color-background)] hover:bg-[color-mix(in_srgb,var(--color-accent)_80%,black)]",
  ghost:
    "bg-transparent text-[var(--color-foreground)] hover:bg-[var(--color-foreground)]/5",
};

export const Button = ({
  variant = "primary",
  className = "",
  type = "button",
  ...rest
}: Props) => (
  <button
    type={type}
    className={`${BASE} ${VARIANTS[variant]} ${className}`}
    {...rest}
  />
);
