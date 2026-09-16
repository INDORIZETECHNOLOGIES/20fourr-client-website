import { formatPaiseRounded } from "@/lib/money";
import type { MaskedProvider } from "@/lib/provider-display";
import { productSurface, type ProductSurface } from "@/components/marketing/product-surface";

/**
 * Decorative product chrome for the search/quote block.
 * Uses the same live listing as the hero when one exists; never invents a name,
 * rating or rate. Hidden from assistive tech because it duplicates that listing.
 */
export function ProviderSelectMock({
  provider,
  surface = "paper",
}: {
  provider: MaskedProvider | null;
  surface?: ProductSurface;
}) {
  const t = productSurface[surface];
  const rate = provider?.hourlyRatePaise
    ? `${formatPaiseRounded(provider.hourlyRatePaise)}/hr`
    : provider?.dailyRatePaise
      ? `${formatPaiseRounded(provider.dailyRatePaise)}/day`
      : null;

  return (
    <div aria-hidden="true" className={`${t.panel} ${t.hover}`}>
      <div className="flex flex-wrap items-center gap-2">
        {provider?.isVerified ? (
          <span className="rounded-sm border border-live px-2 py-0.5 text-label font-medium text-live">
            Verified
          </span>
        ) : null}
        <p className={t.body}>{provider?.title ?? "Licensed professional"}</p>
      </div>
      <p className={`mt-2 ${t.mid}`}>{provider?.categoryLabel ?? "Security guard"}</p>
      <p className={`mt-0.5 ${t.mid}`}>{provider?.city ?? "City chosen at booking"}</p>
      {provider?.averageRating != null ? (
        <p className={`mt-2 ${t.sm}`}>
          {provider.averageRating.toFixed(1)}
          {provider.totalRatings ? ` · ${provider.totalRatings}` : ""}
        </p>
      ) : null}
      {rate ? <p className={`mt-2 ${t.mono}`}>{rate}</p> : null}
      {provider?.code ? <p className={`mt-1 ${t.faint}`}>{provider.code}</p> : null}
      <div className="mt-4 flex gap-2">
        <span className={t.ghostBtn}>View details</span>
        <span className={t.solidBtn}>Book</span>
      </div>
    </div>
  );
}
