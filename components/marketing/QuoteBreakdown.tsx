import { formatPaise } from "@/lib/money";
import type { WorkedQuote } from "@/lib/sample-quote";

export function QuoteBreakdown({
  quote,
  className = "",
}: {
  quote: WorkedQuote;
  className?: string;
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
        <div className="mt-2 flex items-baseline justify-between gap-4 border-t border-rule pt-3">
          <dt className="text-body font-medium text-ink">Total</dt>
          <dd className="text-mono-lg text-ink">{formatPaise(quote.totalPaise)}</dd>
        </div>
      </dl>
      <p className="mt-3 text-body-sm text-ink-faint">{quote.note}</p>
    </div>
  );
}
