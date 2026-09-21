"use client";

import type { PriceQuote } from "@/lib/api/pricing";
import { quoteTotalPaise, toDisplayLines } from "@/lib/api/pricing";
import { formatPaise } from "@/lib/money";

export function PriceSummary({
  price,
  loading,
  error,
  className = "",
}: {
  price: PriceQuote | null;
  loading?: boolean;
  error?: string | null;
  className?: string;
}) {
  if (loading) {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-4 animate-pulse rounded-sm bg-panel-raised" />
        ))}
      </div>
    );
  }

  if (error || !price) {
    return (
      <p role="alert" className={`text-body-sm text-fault ${className}`}>
        {error ?? "Pick a date, time and duration to see the price."}
      </p>
    );
  }

  return <QuoteBreakdown quote={price} className={className} />;
}

/** Itemized money for any surface that already has a tagged quote. */
export function QuoteBreakdown({
  quote,
  className = "",
  compact = false,
}: {
  quote: PriceQuote;
  className?: string;
  compact?: boolean;
}) {
  const rows = toDisplayLines(quote);
  const total = quoteTotalPaise(quote);

  return (
    <div className={className}>
      <dl className={compact ? "flex flex-col gap-1" : "flex flex-col gap-2.5"}>
        {rows.map((row, i) => (
          <div
            key={`${row.label}-${i}`}
            className={[
              "flex items-baseline justify-between gap-3",
              row.subtotal ? (compact ? "border-t border-hairline pt-1" : "border-t border-hairline pt-2.5") : "",
            ].join(" ")}
          >
            <dt
              className={[
                compact ? "text-label" : "text-body-sm",
                row.subtotal ? "font-medium text-fg" : "text-fg-mid",
              ].join(" ")}
            >
              {row.label}
              {row.note ? (
                <span className="mt-0.5 block text-label font-normal text-fg-faint">{row.note}</span>
              ) : null}
            </dt>
            <dd className={`text-mono tabular-nums ${compact ? "text-label text-fg" : "text-fg"}`}>
              {formatPaise(row.amountPaise)}
            </dd>
          </div>
        ))}
        <div
          className={[
            "flex items-baseline justify-between",
            compact ? "mt-1 border-t border-hairline pt-1.5" : "mt-2 border-t border-hairline pt-3",
          ].join(" ")}
        >
          <dt className={compact ? "text-body-sm font-medium text-fg" : "text-body font-medium text-fg"}>
            To be paid
          </dt>
          <dd className={`tabular-nums ${compact ? "text-mono text-fg" : "text-mono-lg text-fg"}`}>
            {formatPaise(total)}
          </dd>
        </div>
      </dl>
    </div>
  );
}
