import { QuoteBreakdown } from "@/components/marketing/QuoteBreakdown";
import { MarketingCta } from "@/components/marketing/MarketingCta";
import { DEFAULT_QUOTE } from "@/lib/sample-quote";
import { formatPaise, formatPaiseRounded } from "@/lib/money";
import type { MaskedProvider } from "@/lib/provider-display";

export function ProductHero({ provider }: { provider: MaskedProvider | null }) {
  const serviceLine = DEFAULT_QUOTE.lines.find((l) => l.id === "service");
  const rate = provider
    ? provider.hourlyRatePaise
      ? `${formatPaiseRounded(provider.hourlyRatePaise)}/hr`
      : provider.dailyRatePaise
        ? `${formatPaiseRounded(provider.dailyRatePaise)}/day`
        : null
    : serviceLine
      ? formatPaise(serviceLine.amountPaise)
      : null;

  return (
    <div className="rounded-lg border border-rule bg-paper transition-colors duration-150 hover:border-edge">
      <div className="flex items-center justify-between border-b border-rule px-4 py-3">
        <p className="text-label text-ink-mid">Provider search</p>
        <p className="text-mono text-ink-faint">{provider?.code ?? "guard · 8h"}</p>
      </div>

      <div className="border-b border-rule px-4 py-5">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-h3 text-ink">{provider?.title ?? "Licensed professional"}</p>
          {provider?.isVerified !== false ? (
            <span className="rounded-sm border border-live px-2 py-0.5 text-label font-medium text-live">
              Verified
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-body text-ink-mid">
          {provider?.categoryLabel ?? "Security guard"}
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3">
          <div>
            <dt className="text-label text-ink-faint">Licence</dt>
            <dd className="mt-0.5 text-body-sm text-ink">PSARA checked for the shift</dd>
          </div>
          <div>
            <dt className="text-label text-ink-faint">Location</dt>
            <dd className="mt-0.5 text-body-sm text-ink">
              {provider?.city ?? "City chosen at booking"}
            </dd>
          </div>
          {provider?.averageRating != null ? (
            <div>
              <dt className="text-label text-ink-faint">Rating</dt>
              <dd className="mt-0.5 text-body-sm text-ink">
                {provider.averageRating.toFixed(1)}
                {provider.totalRatings ? ` · ${provider.totalRatings}` : ""}
              </dd>
            </div>
          ) : (
            <div>
              <dt className="text-label text-ink-faint">Availability</dt>
              <dd className="mt-0.5 text-body-sm text-ink">Shown against the shift date</dd>
            </div>
          )}
          <div>
            <dt className="text-label text-ink-faint">From</dt>
            <dd className="mt-0.5 text-mono text-ink">{rate ?? "Itemized in quote"}</dd>
          </div>
        </dl>
        <MarketingCta href="/#find" className="mt-5 w-full min-w-0">
          Find security
        </MarketingCta>
      </div>

      <QuoteBreakdown quote={DEFAULT_QUOTE} className="rounded-none border-0 bg-paper-raised" />
    </div>
  );
}
