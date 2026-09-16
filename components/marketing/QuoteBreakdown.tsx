import type { ReactNode } from "react";
import { formatPaise } from "@/lib/money";
import type { WorkedQuote, WorkedQuoteLine } from "@/lib/sample-quote";

const GROUPS: { id: string; label: string; match: (line: WorkedQuoteLine) => boolean }[] = [
  {
    id: "service",
    label: "Service",
    match: (line) => line.id === "service" || line.id === "sgst-s" || line.id === "cgst-s",
  },
  { id: "fees", label: "Fees", match: (line) => line.id === "platform" },
  {
    id: "gst",
    label: "GST",
    match: (line) => line.id === "sgst-p" || line.id === "cgst-p",
  },
];

export function QuoteBreakdown({
  quote,
  className = "",
  action,
}: {
  quote: WorkedQuote;
  className?: string;
  action?: ReactNode;
}) {
  const grouped = GROUPS.map((group) => ({
    ...group,
    lines: quote.lines.filter(group.match),
  })).filter((group) => group.lines.length > 0);

  const leftover = quote.lines.filter((line) => !GROUPS.some((g) => g.match(line)));

  return (
    <div className={`rounded-lg border border-rule bg-paper p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-eyebrow text-ink-faint">Quote · {quote.hours}-hour shift</p>
        <p className="rounded-sm border border-rule px-2 py-0.5 text-label text-ink-mid">
          Itemized
        </p>
      </div>
      <dl className="mt-4 flex flex-col gap-4">
        {grouped.map((group) => (
          <div key={group.id}>
            <p className="text-label text-ink-faint">{group.label}</p>
            <div className="mt-1.5 flex flex-col gap-1.5">
              {group.lines.map((line) => (
                <div key={line.id} className="flex items-baseline justify-between gap-4">
                  <dt className="min-w-0 text-body-sm text-ink-mid">{line.label}</dt>
                  <dd className="shrink-0 text-mono text-ink">{formatPaise(line.amountPaise)}</dd>
                </div>
              ))}
            </div>
          </div>
        ))}
        {leftover.map((line) => (
          <div key={line.id} className="flex items-baseline justify-between gap-4">
            <dt className="min-w-0 text-body-sm text-ink-mid">{line.label}</dt>
            <dd className="shrink-0 text-mono text-ink">{formatPaise(line.amountPaise)}</dd>
          </div>
        ))}
        <div className="flex items-baseline justify-between gap-4 border-t border-ink pt-4">
          <dt className="text-h3 text-ink">Total</dt>
          <dd className="shrink-0 text-mono-lg text-ink">{formatPaise(quote.totalPaise)}</dd>
        </div>
      </dl>
      {action ? <div className="mt-5">{action}</div> : null}
      <p className="mt-3 text-body-sm text-ink-faint">{quote.note}</p>
    </div>
  );
}
