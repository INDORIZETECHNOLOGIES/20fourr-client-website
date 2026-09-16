import { MarketingCta } from "@/components/marketing/MarketingCta";
import { formatPaiseRounded } from "@/lib/money";
import type { MaskedProvider } from "@/lib/provider-display";

export function PublicListings({ listings }: { listings: MaskedProvider[] }) {
  if (listings.length === 0) return null;

  return (
    <section id="find" className="border-b border-rule">
      <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6 lg:py-24">
        <p className="text-eyebrow text-ink-faint">Find security</p>
        <h2 className="text-h1 mt-3 text-ink">Verified listings, names withheld</h2>
        <p className="mt-4 max-w-prose text-body text-ink-mid">
          These are live providers from the public index. Agency trading names and individual
          names stay off this page. Booking a shift still requires an account.
        </p>
        <ul className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2">
          {listings.map((p) => {
            const rate = p.hourlyRatePaise
              ? `${formatPaiseRounded(p.hourlyRatePaise)}/hr`
              : p.dailyRatePaise
                ? `${formatPaiseRounded(p.dailyRatePaise)}/day`
                : null;
            return (
              <li
                key={p.id}
                className="rounded-lg border border-rule bg-paper p-5 transition-colors duration-150 hover:border-edge"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-h3 text-ink">{p.title}</p>
                    <p className="mt-1 text-mono text-ink-faint">{p.code}</p>
                  </div>
                  {p.isVerified ? (
                    <span className="rounded-sm border border-live px-2 py-0.5 text-label font-medium text-live">
                      Verified
                    </span>
                  ) : null}
                </div>
                <p className="mt-3 text-body text-ink-mid">
                  {[p.categoryLabel, p.city].filter(Boolean).join(" · ") || "Category on the listing"}
                </p>
                <div className="mt-3 flex flex-wrap items-baseline justify-between gap-2">
                  {p.averageRating != null ? (
                    <p className="text-body-sm text-ink">
                      {p.averageRating.toFixed(1)}
                      {p.totalRatings ? ` · ${p.totalRatings}` : ""}
                    </p>
                  ) : (
                    <p className="text-body-sm text-ink-faint">No ratings yet</p>
                  )}
                  {rate ? <p className="text-mono text-ink">From {rate}</p> : null}
                </div>
              </li>
            );
          })}
        </ul>
        <p className="mt-8 text-body-sm text-ink-mid">
          To place a booking you will be asked to sign in.
        </p>
        <MarketingCta href="/login?next=%2Fbook" className="mt-4">
          Sign in to book
        </MarketingCta>
      </div>
    </section>
  );
}
