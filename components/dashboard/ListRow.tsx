import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronRightIcon } from "@/components/dashboard/icons";

/**
 * The one-row list card, used by bookings, tickets and invoices.
 *
 * The previous version put everything on a single grey line — date, time,
 * location and provider ran together at the same weight, the leading tile was
 * the same gold shield for every service, and the only status signal was a
 * small chip beside the title. Cancelled rows looked exactly as loud as live
 * ones, and on a wide screen the content hugged both edges with a void between.
 *
 * What this does differently:
 *
 *  - **A status rail.** A 3px coloured edge carries the state, so a list scans
 *    by colour before anything is read. The chip stays for the exact word.
 *  - **Two tiers of metadata.** The identifying facts (date, time) sit above
 *    the situational ones (location, who's assigned), instead of one run-on.
 *  - **Terminal rows recede.** Cancelled and closed rows drop to 60% so live
 *    work dominates the page.
 *  - **The amount is the anchor** on the right, with the reference beneath it
 *    in tabular figures so a column of them lines up.
 */

export type RowMeta = {
  icon?: ReactNode;
  text: ReactNode;
  /** Truncate first when space runs out — used for long addresses. */
  flexible?: boolean;
};

export function ListRow({
  href,
  railClass = "bg-hairline",
  icon,
  iconClass = "bg-panel-raised text-fg",
  title,
  badge,
  primaryMeta = [],
  secondaryMeta = [],
  amount,
  reference,
  muted = false,
  trailing,
}: {
  href?: string;
  /** Status colour for the left rail. Falls back to a hairline. */
  railClass?: string;
  icon: ReactNode;
  iconClass?: string;
  title: ReactNode;
  badge?: ReactNode;
  primaryMeta?: RowMeta[];
  secondaryMeta?: RowMeta[];
  amount?: ReactNode;
  reference?: ReactNode;
  /** Dim the row — for cancelled, rejected or closed records. */
  muted?: boolean;
  trailing?: ReactNode;
}) {
  const body = (
    <>
      {/* Status rail */}
      <span
        aria-hidden
        className={`absolute inset-y-0 left-0 w-[3px] rounded-l-lg ${railClass}`}
      />

      <span
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${iconClass}`}
      >
        {icon}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <span className="text-body font-semibold leading-tight text-fg">{title}</span>
          {badge}
        </span>

        {primaryMeta.length > 0 ? (
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
            {primaryMeta.map((m, i) => (
              <MetaItem key={i} meta={m} tone="primary" showDot={i > 0} />
            ))}
          </span>
        ) : null}

        {secondaryMeta.length > 0 ? (
          <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            {secondaryMeta.map((m, i) => (
              <MetaItem key={i} meta={m} tone="secondary" showDot={i > 0} />
            ))}
          </span>
        ) : null}
      </span>

      {amount || reference ? (
        <span className="flex shrink-0 flex-col items-start gap-0.5 sm:items-end">
          {amount ? (
            <span className="w-full min-w-[160px] text-mono text-fg sm:w-auto">
              {amount}
            </span>
          ) : null}
          {reference ? (
            <span className="font-mono text-eyebrow tabular-nums text-fg-faint">
              {reference}
            </span>
          ) : null}
        </span>
      ) : null}

      {trailing}

      {href ? (
        <span className="hidden shrink-0 text-fg-faint transition-colors group-hover:text-fg sm:block">
          <ChevronRightIcon size={16} />
        </span>
      ) : null}
    </>
  );

  const className = [
    "group relative flex flex-col gap-3 overflow-hidden rounded-lg border border-hairline bg-panel py-4 pl-5 pr-5 transition-all",
    "sm:flex-row sm:items-center sm:gap-4 sm:pl-6",
    muted ? "opacity-60 hover:opacity-90" : "",
    href ? "cursor-pointer hover:border-hairline hover:bg-panel-raised" : "",
  ].join(" ");

  if (href) {
    return (
      <Link href={href} className={className}>
        {body}
      </Link>
    );
  }
  return <div className={className}>{body}</div>;
}

function MetaItem({
  meta,
  tone,
  showDot,
}: {
  meta: RowMeta;
  tone: "primary" | "secondary";
  showDot: boolean;
}) {
  return (
    <>
      {/* A dot separator rather than more icons — at this size a row of tiny
          glyphs reads as noise and none of them are individually legible. */}
      {showDot ? <span className="text-fg-faint">·</span> : null}
      <span
        className={[
          "flex min-w-0 items-center gap-1.5",
          meta.flexible ? "max-w-full truncate" : "shrink-0",
          tone === "primary" ? "text-body-sm text-fg-mid" : "text-body-sm text-fg-faint",
        ].join(" ")}
      >
        {meta.icon ? <span className="shrink-0 text-fg-faint">{meta.icon}</span> : null}
        <span className="truncate">{meta.text}</span>
      </span>
    </>
  );
}
