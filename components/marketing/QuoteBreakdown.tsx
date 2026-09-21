import type { ReactNode } from "react";
import { formatPaise } from "@/lib/money";
import type { WorkedQuote, WorkedQuoteLine } from "@/lib/sample-quote";
import { productSurface, type ProductSurface } from "@/components/marketing/product-surface";

const isGst = (line: WorkedQuoteLine) => line.id === "gst";
const isSubtotal = (line: WorkedQuoteLine) => line.id === "subtotal";

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

  return (
    <div className={`${t.shell} p-5 ${className}`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={t.eyebrow}>Quote · {quote.hours}-hour shift</p>
        <p className={t.badge}>Itemized</p>
      </div>
      <dl className="mt-4 flex flex-col gap-2">
        {quote.lines.map((line) => {
          const muted = mutedGst && isGst(line);
          const subtotal = isSubtotal(line);
          return (
            <div
              key={line.id}
              className={`flex items-baseline justify-between gap-4 ${subtotal ? `pt-2 ${t.totalRule}` : ""}`}
            >
              <dt className={`min-w-0 ${muted ? t.label : subtotal ? t.title : t.mid}`}>{line.label}</dt>
              <dd className={`shrink-0 ${muted ? t.label : t.mono}`}>{formatPaise(line.amountPaise)}</dd>
            </div>
          );
        })}
        <div className={`mt-2 flex items-baseline justify-between gap-4 pt-4 ${t.totalRule}`}>
          <dt className={t.title}>To be paid</dt>
          <dd className={`shrink-0 ${t.monoLg}`}>{formatPaise(quote.totalPaise)}</dd>
        </div>
      </dl>
      {action ? <div className="mt-5">{action}</div> : null}
      <p className={`mt-3 ${t.note}`}>{quote.note}</p>
    </div>
  );
}
