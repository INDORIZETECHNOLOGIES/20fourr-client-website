import { formatPaiseRounded } from "@/lib/money";
import type { MaskedProvider } from "@/lib/provider-display";

/**
 * Decorative product chrome for the search/quote block.
 * Uses the same live listing as the hero when one exists; never invents a name,
 * rating or rate. Hidden from assistive tech because it duplicates that listing.
 */
export function ProviderSelectMock({ provider }: { provider: MaskedProvider | null }) {
  const rate = provider?.hourlyRatePaise
    ? `${formatPaiseRounded(provider.hourlyRatePaise)}/hr`
    : provider?.dailyRatePaise
      ? `${formatPaiseRounded(provider.dailyRatePaise)}/day`
      : null;

  return (
    <div
      aria-hidden="true"
      className="rounded-sm border border-rule bg-paper p-4 transition-colors duration-150 hover:border-edge"
    >
      <div className="flex flex-wrap items-center gap-2">
        {provider?.isVerified ? (
          <span className="rounded-sm border border-live px-2 py-0.5 text-label font-medium text-live">
            Verified
          </span>
        ) : null}
        <p className="text-body font-medium text-ink">{provider?.title ?? "Licensed professional"}</p>
      </div>
      <p className="mt-2 text-body-sm text-ink-mid">
        {provider?.categoryLabel ?? "Security guard"}
      </p>
      <p className="mt-0.5 text-body-sm text-ink-mid">
        {provider?.city ?? "City chosen at booking"}
      </p>
      {provider?.averageRating != null ? (
        <p className="mt-2 text-body-sm text-ink">
          {provider.averageRating.toFixed(1)}
          {provider.totalRatings ? ` · ${provider.totalRatings}` : ""}
        </p>
      ) : null}
      {rate ? <p className="mt-2 text-mono text-ink">{rate}</p> : null}
      {provider?.code ? <p className="mt-1 text-mono text-ink-faint">{provider.code}</p> : null}
      <div className="mt-4 flex gap-2">
        <span className="inline-flex h-10 min-w-0 flex-1 cursor-default items-center justify-center rounded-sm border border-edge px-3 text-label text-ink">
          View details
        </span>
        <span className="inline-flex h-10 min-w-0 flex-1 cursor-default items-center justify-center rounded-sm bg-ink px-3 text-label text-paper">
          Book
        </span>
      </div>
    </div>
  );
}
