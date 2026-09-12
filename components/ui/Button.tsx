import type { ButtonHTMLAttributes, ReactNode } from "react";
import { SpinnerIcon } from "@/components/icons";

const VARIANTS = {
  primary:
    "border-transparent bg-primary text-on-primary hover:opacity-90",
  secondary:
    "border-edge bg-transparent text-fg hover:bg-panel-raised",
  ghost: "border-transparent bg-transparent text-fg hover:bg-panel-raised",
  danger: "border-transparent bg-fault text-ground-ink hover:opacity-90",
} as const;

const SIZES = {
  sm: "h-8 px-3 text-label",
  md: "h-10 px-4 text-body",
  lg: "h-12 px-5 text-body",
} as const;

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  loadingLabel?: string;
  variant?: keyof typeof VARIANTS;
  size?: keyof typeof SIZES;
};

export function Button({
  children,
  loading = false,
  loadingLabel = "Working…",
  variant = "primary",
  size = "md",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const inert = disabled || loading;

  return (
    <button
      {...props}
      disabled={inert}
      aria-busy={loading || undefined}
      className={[
        "inline-flex w-full items-center justify-center gap-2 rounded-sm border font-medium",
        "transition-opacity duration-150 ease-out",
        VARIANTS[variant],
        SIZES[size],
        inert ? "cursor-not-allowed opacity-45" : "cursor-pointer",
        className,
      ].join(" ")}
    >
      {loading ? (
        <>
          <SpinnerIcon />
          <span>{loadingLabel}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}
