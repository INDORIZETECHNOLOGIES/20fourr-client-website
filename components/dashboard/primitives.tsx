import type { ReactNode } from "react";
import Link from "next/link";
import { STATUS_STYLES, type BookingStatus } from "@/lib/dashboard-data";

const WEIGHT = {
  primary: "rounded-lg border border-hairline bg-panel",
  flat: "rounded-lg border-0 bg-transparent",
  inset: "rounded-lg border border-hairline bg-panel-raised",
} as const;

export function Card({
  children,
  className = "",
  asChild = false,
  href,
  weight = "primary",
}: {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
  href?: string;
  weight?: keyof typeof WEIGHT;
}) {
  const cls = `${WEIGHT[weight]} ${className}`;

  if (asChild && href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return <div className={cls}>{children}</div>;
}

export function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-h2 text-fg">{title}</h2>
      <p className="mt-1 text-body-sm text-fg-mid">{subtitle}</p>
    </div>
  );
}

export function StatusPill({
  status,
  className = "",
}: {
  status: BookingStatus;
  className?: string;
}) {
  const s = STATUS_STYLES[status];
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-sm border px-2 py-0.5 text-label font-medium ${s.className} ${className}`}
    >
      {s.label}
    </span>
  );
}

export function GhostAction({
  children,
  href,
}: {
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="rounded-sm border border-edge px-2.5 py-1 text-label font-medium text-fg transition-colors duration-150 ease-out hover:bg-panel-raised"
    >
      {children}
    </Link>
  );
}
