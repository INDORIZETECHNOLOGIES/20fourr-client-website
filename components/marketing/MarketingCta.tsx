import Link from "next/link";
import type { ReactNode } from "react";

type Variant = "primary" | "secondary" | "inverse";

const STYLES: Record<Variant, string> = {
  primary: "border-transparent bg-ink text-paper hover:opacity-90",
  secondary: "border-edge bg-transparent text-ink hover:bg-paper-raised",
  inverse: "border-transparent bg-paper text-ink hover:bg-paper-raised",
};

export function MarketingCta({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: Variant;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={[
        "inline-flex h-12 min-w-[9.5rem] items-center justify-center rounded-sm border px-5 text-body font-medium transition-[opacity,background-color,color] duration-150 ease-out",
        STYLES[variant],
        className,
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
