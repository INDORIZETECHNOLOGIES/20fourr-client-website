import type { ReactNode } from "react";
import { formatPaise } from "@/lib/money";
import type { WorkedQuote } from "@/lib/sample-quote";

export function QuoteBreakdown({
  quote,
  className = "",
  action,
}: {
  quote: WorkedQuote;
  className?: string;
  action?: ReactNode;
}) {
  return (
    <div className={`rounded-lg border border-rule bg-paper-raised p-6 ${className}`}>
      <p className="text-eyebrow text-ink-faint">Quote · {quote.hours}-hour shift</p>
      <dl className="mt-4 flex flex-col gap-2.5">
        {quote.lines.map((line) => (
          <div key={line.id} className="flex items-baseline justify-between gap-4">
            <dt className="text-body-sm text-ink-mid">{line.label}</dt>
            <dd className="text-mono text-ink">{formatPaise(line.amountPaise)}</dd>
          </div>
        ))}
        <div className="mt-3 flex items-baseline justify-between gap-4 border-t border-ink pt-4">
          <dt className="text-h3 text-ink">Total</dt>
          <dd className="text-mono-lg text-ink">{formatPaise(quote.totalPaise)}</dd>
        </div>
      </dl>
      {action ? <div className="mt-5">{action}</div> : null}
      <p className="mt-3 text-body-sm text-ink-faint">{quote.note}</p>
    </div>
  );
}
