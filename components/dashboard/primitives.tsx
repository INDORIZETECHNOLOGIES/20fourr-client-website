import type { ReactNode } from "react";
import Link from "next/link";
import { STATUS_STYLES, type BookingStatus } from "@/lib/dashboard-data";

/**
 * The dashboard's standard panel. Pass `asChild` with an `href` to render it as
 * a link — used where the whole card is the click target, so it stays one
 * focusable element rather than a div wrapping an anchor.
 */
export function Card({
  children,
  className = "",
  asChild = false,
  href,
}: {
  children: ReactNode;
  className?: string;
  asChild?: boolean;
  href?: string;
}) {
  const cls = `rounded-2xl border border-white/6 bg-app-card ${className}`;

  if (asChild && href) {
    return (
      <Link href={href} className={cls}>
        {children}
      </Link>
    );
  }
  return <div className={cls}>{children}</div>;
}

/** Page heading used by Services / Bookings / Profile / Support. */
export function PageHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <h2 className="font-display text-[22px] font-extrabold tracking-[-0.5px] text-slate-100">
        {title}
      </h2>
      <p className="mt-1 text-[13.5px] text-slate-600">{subtitle}</p>
    </div>
  );
}

/** The rounded status chip on bookings. Colors come from the design's statusMap. */
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
      style={{ background: s.bg, color: s.color }}
      className={`inline-block whitespace-nowrap rounded-full px-2.5 py-[3px] text-[11px] font-bold ${className}`}
    >
      {s.label}
    </span>
  );
}

/** The "See All" / "View All" outline button in card headers. */
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
      className="rounded-md border border-app-gold/25 px-2.5 py-1 text-xs font-semibold text-app-gold transition-colors hover:bg-app-gold/8"
    >
      {children}
    </Link>
  );
}
