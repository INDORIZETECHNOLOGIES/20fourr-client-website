import type { Coverage } from "@/lib/marketing-data";

/**
 * Gazetteer, not a ranked card grid and not a map.
 *
 * Spec 0001 wants cities + counts as evidence. A one-column stack of 40
 * hairline rows is that data with no hierarchy — it reads as a dump.
 * This is the same list as a typeset directory: two ledger figures, then
 * a multi-column index.
 */
export function CoverageDirectory({ coverage }: { coverage: Coverage }) {
  const { cities, verifiedProviders } = coverage;

  if (cities.length === 0) {
    return (
      <p className="mt-4 max-w-prose text-body text-ink-mid">
        The booking funnel lists only cities that currently have a bookable, verified provider.
        That list is not duplicated here as a static count, because a marketing number that
        drifted from availability would be a false claim.
      </p>
    );
  }

  return (
    <>
      <div className="mt-8 grid grid-cols-2 divide-x divide-rule border-y border-rule">
        <Metric label="Cities" value={String(cities.length)} />
        {verifiedProviders != null ? (
          <Metric label="Providers" value={String(verifiedProviders)} />
        ) : (
          <Metric label="Listings" value={String(cities.reduce((n, c) => n + c.providers, 0))} />
        )}
      </div>

      <ol className="grid grid-cols-1 gap-x-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cities.map((c) => (
          <li
            key={c.city}
            className="flex items-baseline justify-between gap-3 border-b border-rule py-2.5"
          >
            <span className="min-w-0 truncate text-body-sm text-ink">{c.city}</span>
            <span className="shrink-0 text-mono tabular-nums text-ink-mid">{c.providers}</span>
          </li>
        ))}
      </ol>
      <p className="mt-4 text-body-sm text-ink-faint">
        The figure is how many verified providers list that city.
      </p>
    </>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="py-5 pr-6 last:pr-0 last:pl-6">
      <p className="text-label text-ink-faint">{label}</p>
      <p className="mt-2 text-mono-lg text-ink">{value}</p>
    </div>
  );
}
