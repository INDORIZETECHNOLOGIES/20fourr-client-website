"use client";

import { useMemo, useState } from "react";
import { QuoteBreakdown } from "@/components/marketing/QuoteBreakdown";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import { SERVICE_CATALOGUE } from "@/lib/services";
import { CANCELLATION_SUMMARY } from "@/lib/cancellation-policy";
import { workedQuote } from "@/lib/sample-quote";

const HOURS = [4, 8, 12];

export function CostCalculator() {
  const [category, setCategory] = useState("guard");
  const [hours, setHours] = useState(8);
  const quote = useMemo(() => workedQuote(category, hours), [category, hours]);

  return (
    <div>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        <div className="flex-1">
          <p className="text-label text-ink-mid">Category</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {SERVICE_CATALOGUE.map((s) => (
              <button
                key={s.id}
                type="button"
                aria-pressed={category === s.id}
                onClick={() => setCategory(s.id)}
                className={[
                  "rounded-sm border px-4 py-2 text-body",
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
                  "rounded-sm border px-4 py-2 text-body",
                  hours === h
                    ? "border-ink bg-ink text-paper"
                    : "border-edge text-ink hover:bg-paper-raised",
                ].join(" ")}
              >
                {h} hours
              </button>
            ))}
          </div>
        </div>
        <QuoteBreakdown
          quote={quote}
          className="w-full lg:max-w-md"
          action={
            <MarketingCta href="/book" className="w-full min-w-0">
              Continue booking
            </MarketingCta>
          }
        />
      </div>
      <p className="mt-6 max-w-prose text-body text-ink-mid">{CANCELLATION_SUMMARY}</p>
    </div>
  );
}
