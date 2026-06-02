import { type ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" };

export const Button = ({ variant = "primary", className = "", type = "button", ...rest }: Props) => {
  const base = "px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed";
  const styles = variant === "primary"
    ? "bg-[var(--color-mwedzi)] text-[var(--color-gora)] hover:bg-[var(--color-shavi)] hover:text-[var(--color-ndoro)]"
    : "bg-transparent text-[var(--color-gora)] hover:bg-[var(--color-gora)]/5";
  return <button type={type} className={`${base} ${styles} ${className}`} {...rest} />;
};
