import type { ButtonHTMLAttributes, ReactNode } from "react";
import { SpinnerIcon } from "@/components/icons";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  loading?: boolean;
  /**
   * `pill` is the 24px-radius verify button; `default` is the 16px-radius
   * Sign In / Create Account button. Both from the source designs.
   */
  shape?: "default" | "pill";
  /**
   * When false the button renders in the designs' inert style (#1a2740 on
   * #5b6b82) instead of the gold gradient. Used by the verify screens, where
   * the button stays flat until all six digits are entered.
   */
  active?: boolean;
  loadingLabel?: string;
};

export function Button({
  children,
  loading = false,
  shape = "default",
  active = true,
  loadingLabel = "Working…",
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const isInert = disabled || loading || !active;

  return (
    <button
      {...props}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={[
        "flex w-full items-center justify-center gap-2.5 border-none px-4 py-[18px]",
        "text-[17px] font-bold transition-opacity duration-150",
        shape === "pill" ? "rounded-[24px]" : "rounded-field",
        isInert
          ? "cursor-not-allowed bg-disabled-bg text-disabled-fg"
          : "bg-gold-gradient text-on-gold cursor-pointer hover:opacity-90 active:opacity-80",
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
