import type { ReactNode } from "react";
import { formatPaise } from "@/lib/money";
import type { WorkedQuote, WorkedQuoteLine } from "@/lib/sample-quote";
import { productSurface, type ProductSurface } from "@/components/marketing/product-surface";

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
  surface = "paper",
  mutedGst = false,
}: {
  quote: WorkedQuote;
  className?: string;
  action?: ReactNode;
  surface?: ProductSurface;
  /** Renders the GST group a step smaller and muted — required lines that shouldn't dominate. */
  mutedGst?: boolean;
}) {
  const t = productSurface[surface];
  const grouped = GROUPS.map((group) => ({
    ...group,
    lines: quote.lines.filter(group.match),
  })).filter((group) => group.lines.length > 0);

  const leftover = quote.lines.filter((line) => !GROUPS.some((g) => g.match(line)));

  return (
    <div className={`${t.shell} p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={t.eyebrow}>Quote · {quote.hours}-hour shift</p>
        <p className={t.badge}>Itemized</p>
      </div>
      <dl className="mt-4 flex flex-col gap-4">
        {grouped.map((group) => {
          const muted = mutedGst && group.id === "gst";
          return (
            <div key={group.id}>
              <p className={t.label}>{group.label}</p>
              <div className="mt-1.5 flex flex-col gap-1.5">
                {group.lines.map((line) => (
                  <div key={line.id} className="flex items-baseline justify-between gap-4">
                    <dt className={`min-w-0 ${muted ? t.label : t.mid}`}>{line.label}</dt>
                    <dd className={`shrink-0 ${muted ? t.label : t.mono}`}>
                      {formatPaise(line.amountPaise)}
                    </dd>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
        {leftover.map((line) => (
          <div key={line.id} className="flex items-baseline justify-between gap-4">
            <dt className={`min-w-0 ${t.mid}`}>{line.label}</dt>
            <dd className={`shrink-0 ${t.mono}`}>{formatPaise(line.amountPaise)}</dd>
          </div>
        ))}
        <div className={`flex items-baseline justify-between gap-4 pt-4 ${t.totalRule}`}>
          <dt className={t.title}>Total</dt>
          <dd className={`shrink-0 ${t.monoLg}`}>{formatPaise(quote.totalPaise)}</dd>
        </div>
      </dl>
      {action ? <div className="mt-5">{action}</div> : null}
      <p className={`mt-3 ${t.note}`}>{quote.note}</p>
    </div>
  );
}
