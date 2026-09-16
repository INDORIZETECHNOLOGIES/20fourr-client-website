"use client";

import { useMemo, useState } from "react";
import { QuoteBreakdown } from "@/components/marketing/QuoteBreakdown";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import { ProviderSelectMock } from "@/components/marketing/ProviderSelectMock";
import { SERVICE_CATALOGUE } from "@/lib/services";
import { CANCELLATION_SUMMARY } from "@/lib/cancellation-policy";
import { workedQuote, baseHourlyRatePaise } from "@/lib/sample-quote";
import { formatHourlyRate } from "@/lib/money";
import type { MaskedProvider } from "@/lib/provider-display";
import type { ProductSurface } from "@/components/marketing/product-surface";

const HOURS = [4, 8, 12];

const chip =
  "min-h-11 rounded-sm border px-4 py-2 text-body transition-colors duration-150";

export function CostCalculator({
  provider = null,
  surface = "paper",
  showLiveRateBadge = false,
  mutedGst = false,
}: {
  provider?: MaskedProvider | null;
  surface?: ProductSurface;
  /** Shows a "Live rate · ₹X/hr base" badge on the quote card, tracking the selected category. */
  showLiveRateBadge?: boolean;
  /** Renders the GST lines on the quote card smaller and muted. */
  mutedGst?: boolean;
}) {
  const [category, setCategory] = useState("guard");
  const [hours, setHours] = useState(8);
  const quote = useMemo(() => workedQuote(category, hours), [category, hours]);
  const liveBadge = showLiveRateBadge
    ? `Live rate · ${formatHourlyRate(baseHourlyRatePaise(category))} base`
    : undefined;

  return (
    <div>
      <div className="flex min-w-0 flex-col gap-6 lg:flex-row lg:items-start">
        <div className="min-w-0 flex-1">
          <p className="text-label text-ink-mid">Category</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SERVICE_CATALOGUE.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={category === s.id}
                onClick={() => setCategory(s.id)}
                className={[
                  chip,
                  category === s.id
                    ? "border-ink bg-ink text-paper"
                    : "border-edge text-ink hover:bg-paper-raised",
                ].join(" ")}
              >
                {s.name}
              </button>
            ))}
          </div>
          <p className="mt-6 text-label text-ink-mid">Duration</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {HOURS.map((h) => (
              <button
                key={h}
                type="button"
                aria-pressed={hours === h}
                onClick={() => setHours(h)}
                className={[
                  chip,
                  hours === h
                    ? "border-ink bg-ink text-paper"
                    : "border-edge text-ink hover:bg-paper-raised",
                ].join(" ")}
              >
                {h} hours
              </button>
            ))}
          </div>
          <p className="mt-6 text-label text-ink-mid">Provider</p>
          <div className="mt-2 max-w-md">
            <ProviderSelectMock provider={provider} surface={surface} />
          </div>
        </div>
        <QuoteBreakdown
          quote={quote}
          surface={surface}
          badge={liveBadge}
          mutedGst={mutedGst}
          className="w-full min-w-0 lg:max-w-md"
          action={
            <MarketingCta
              href="/book"
              variant={surface === "ink" ? "inverse" : "primary"}
              className="w-full min-w-0"
            >
              Continue booking
            </MarketingCta>
          }
        />
      </div>
      <p className="mt-6 max-w-prose text-body text-ink-mid">{CANCELLATION_SUMMARY}</p>
    </div>
  );
}
