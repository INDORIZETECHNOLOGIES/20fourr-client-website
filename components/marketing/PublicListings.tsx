import { MarketingCta } from "@/components/marketing/MarketingCta";
import { formatPaiseRounded } from "@/lib/money";
import type { MaskedProvider } from "@/lib/provider-display";

export function PublicListings({ listings }: { listings: MaskedProvider[] }) {
  if (listings.length === 0) return null;

  return (
    <section id="find" className="border-b border-rule">
      <div className="mx-auto max-w-[1200px] px-4 py-16 lg:px-6 lg:py-24">
        <h2 className="text-h1 text-ink">Verified listings, names withheld</h2>
        <p className="mt-4 max-w-prose text-body text-ink-mid">
          These are live providers from the public index. Agency trading names and individual
          names stay off this page. Booking a shift still requires an account.
        </p>
        {/* A ruled table, not a card grid: with names withheld, each listing is a row of facts, and
            rows compare at a glance where eight identical cards only repeated themselves. */}
        <div className="mt-10 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b-2 border-ink">
                <th scope="col" className="py-3 pr-4 text-label font-semibold text-ink-mid">Listing</th>
                <th scope="col" className="py-3 pr-4 text-label font-semibold text-ink-mid">Service</th>
                <th scope="col" className="py-3 pr-4 text-label font-semibold text-ink-mid">City</th>
                <th scope="col" className="py-3 pr-4 text-label font-semibold text-ink-mid">Rating</th>
                <th scope="col" className="py-3 text-right text-label font-semibold text-ink-mid">From</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((p) => {
                const rate = p.hourlyRatePaise
                  ? `${formatPaiseRounded(p.hourlyRatePaise)}/hr`
                  : p.dailyRatePaise
                    ? `${formatPaiseRounded(p.dailyRatePaise)}/day`
                    : null;
                return (
                  <tr key={p.id} className="border-b border-rule transition-colors duration-150 hover:bg-paper-raised">
                    <th scope="row" className="py-4 pr-4 align-top font-normal">
                      <span className="flex items-center gap-2">
                        <span className="text-mono text-ink">{p.code}</span>
                        {p.isVerified ? (
                          <span className="rounded-sm border border-live px-1.5 py-px text-label font-medium text-live">
                            Verified
                          </span>
                        ) : null}
                      </span>
                      <span className="mt-1 block text-body-sm text-ink-mid">
                        {p.kind === "agency" ? "Agency" : "Individual"}
                      </span>
                    </th>
                    <td className="py-4 pr-4 align-top text-body text-ink">{p.categoryLabel ?? "—"}</td>
                    <td className="py-4 pr-4 align-top text-body text-ink">{p.city ?? "—"}</td>
                    <td className="py-4 pr-4 align-top text-body-sm text-ink">
                      {p.averageRating != null ? (
                        <>
                          {p.averageRating.toFixed(1)}
                          <span className="text-ink-faint">{p.totalRatings ? ` · ${p.totalRatings} ratings` : ""}</span>
                        </>
                      ) : (
                        <span className="text-ink-faint">No ratings yet</span>
                      )}
                    </td>
                    <td className="py-4 text-right align-top text-mono text-ink">{rate ?? "In the quote"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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
