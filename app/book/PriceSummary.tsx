"use client";

import type { PricePreview } from "@/lib/api/pricing";
import { formatPaise, formatPaiseRounded } from "@/lib/money";

/**
 * The server's price breakdown, rendered verbatim.
 *
 * Nothing here is recomputed in the browser. The labels adapt to what the
 * server actually billed — hourly vs per-day is its decision, not ours, and
 * captioning a per-day booking as "hourly rate × 8h" would misdescribe the
 * charge.
 */
export function PriceSummary({
  price,
  loading,
  error,
  className = "",
}: {
  price: PricePreview | null;
  loading: boolean;
  error: string | null;
  className?: string;
}) {
  if (loading) {
    return (
      <div className={`flex flex-col gap-3 ${className}`}>
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-4 animate-pulse rounded bg-white/8" />
        ))}
      </div>
    );
  }

  if (error || !price) {
    return (
      <p role="alert" className={`text-[13px] text-red-300 ${className}`}>
        {error ?? "Pick a date, time and duration to see the price."}
      </p>
    );
  }

  const basis = price.isHourlyBilling
    ? `Hourly rate${price.hourlyRate ? ` (${formatPaise(price.hourlyRate, { decimals: 0 })}/hr)` : ""} × ${price.totalHours}h`
    : `Daily rate${price.dailyRate ? ` (${formatPaise(price.dailyRate, { decimals: 0 })}/day)` : ""} × ${price.numberOfDays} day${price.numberOfDays === 1 ? "" : "s"}`;

  /**
   * Taxes and remaining charges, derived as the remainder.
   *
   * The preview endpoint does NOT return every component of the total. The
   * server computes
   *
   *   total = subtotal + serviceGst + platformRevenue + appGst
   *
   * but only reports `baseAmount`, `platformFee` and `gstAmount` (the GST on
   * platform revenue). The 18% GST on the security service itself and the flat
   * convenience fee are absent — on an ₹1,200 booking that is ₹266 unaccounted,
   * so listing the named fields and then the total would show a breakdown that
   * visibly fails to add up.
   *
   * Taking the remainder keeps the arithmetic exact and honest: every line is a
   * server number, and they sum to the server's total. Break these out properly
   * once the endpoint returns serviceGst and the convenience fee.
   */
  const otherCharges =
    price.totalAmount - price.baseAmount - price.platformFee;

  return (
    <div className={className}>
      <dl className="flex flex-col gap-2.5 text-[13.5px]">
        <Row label={basis} value={formatPaise(price.baseAmount)} />
        <Row label="Platform fee" value={formatPaise(price.platformFee)} />
        <Row label="GST & other charges" value={formatPaise(otherCharges)} />
        <div className="mt-2 flex items-baseline justify-between border-t border-white/8 pt-3">
          <dt className="text-[14px] font-bold text-slate-200">Total</dt>
          <dd className="font-display text-[20px] font-extrabold text-app-gold">
            {formatPaiseRounded(price.totalAmount)}
          </dd>
        </div>
      </dl>
      {/* Every line is an exact integer-paise figure, so the rounded headline
          above can differ from the charge by up to 99 paise. */}
      <p className="mt-2 text-right text-[11.5px] text-slate-600">
        Exact total {formatPaise(price.totalAmount)}
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-slate-500">{label}</dt>
      <dd className="text-slate-200">{value}</dd>
    </div>
  );
}
