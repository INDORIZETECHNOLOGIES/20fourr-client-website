"use client";

import Link from "next/link";
import { ServiceGlyph } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { ProviderSearchResponse } from "@/lib/api/types";
import {
  EX_SERVICEMAN_FILTER,
  SERVICE_CATALOGUE,
  type ServiceCategory,
} from "@/lib/services";
import { formatPaiseRounded } from "@/lib/money";

/**
 * Live catalogue as a comparison list.
 *
 * Spec 0001: lists beat card grids. Each row asks provider search for one
 * result sorted by price: `pagination.total` is how many providers are
 * bookable, and the first card's rate is a genuine "from" price.
 *
 * Deliberately NOT scoped to the client's city. The API's city filter matches
 * on a derived field that is empty on current provider records.
 */

function RateCell({
  loading,
  hourly,
  daily,
}: {
  loading: boolean;
  hourly: number | null;
  daily: number | null;
}) {
  if (loading) {
    return <span className="inline-block h-4 w-20 animate-pulse rounded-sm bg-panel-raised" />;
  }
  if (hourly) return <>{formatPaiseRounded(hourly)}/hr</>;
  if (daily) return <>{formatPaiseRounded(daily)}/day</>;
  return <span className="text-fg-faint">On request</span>;
}

function ServiceRow({ service }: { service: (typeof SERVICE_CATALOGUE)[number] }) {
  const { data, loading } = useApiQuery<ProviderSearchResponse>("client/providers/search", {
    query: { category: service.id, limit: 1, sortBy: "price" },
  });

  const total = data?.pagination?.total ?? 0;
  const cheapest = data?.providers?.[0]?.pricing;
  const unavailable = !loading && total === 0;

  return (
    <tr className="border-t border-hairline">
      <th scope="row" className="px-4 py-4 text-left align-top">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-hairline text-fg">
            <ServiceGlyph icon={service.icon} size={16} />
          </span>
          <span>
            <span className="block text-body font-medium text-fg">{service.name}</span>
            <span className="mt-0.5 block text-label text-fg-faint">
              {loading ? "Checking availability" : total === 0 ? "None available" : `${total} available`}
            </span>
          </span>
        </div>
      </th>
      <td className="hidden px-4 py-4 align-top text-body-sm text-fg-mid md:table-cell">
        {service.desc}
      </td>
      <td className="px-4 py-4 align-top text-body-sm">
        {service.licenceRequired ? (
          <span className="text-attention">Arms licence verified</span>
        ) : (
          <span className="text-fg-mid">PSARA</span>
        )}
      </td>
      <td className="px-4 py-4 align-top text-right text-mono tabular-nums text-fg">
        <RateCell
          loading={loading}
          hourly={cheapest?.hourlyRate ?? null}
          daily={cheapest?.dailyRate ?? null}
        />
      </td>
      <td className="px-4 py-4 align-top text-right">
        {unavailable ? (
          <span className="text-body-sm text-fg-faint">Unavailable</span>
        ) : (
          <Link
            href={`/book/service?category=${service.id}`}
            className="whitespace-nowrap text-body-sm font-medium text-fg underline-offset-2 hover:underline"
          >
            Book now
          </Link>
        )}
      </td>
    </tr>
  );
}

export function ServiceCatalogue() {
  return (
    <>
      <p className="mb-4 text-body-sm text-fg-faint">
        Starting rates from live provider search. Pick a city when you book.
      </p>

      <div className="overflow-x-auto rounded-lg border border-hairline">
        <table className="w-full min-w-[640px] border-collapse text-left">
          <thead>
            <tr className="bg-panel-raised">
              <th className="px-4 py-3 text-eyebrow font-semibold uppercase tracking-[1.2px] text-fg-faint">
                Category
              </th>
              <th className="hidden px-4 py-3 text-eyebrow font-semibold uppercase tracking-[1.2px] text-fg-faint md:table-cell">
                Covers
              </th>
              <th className="px-4 py-3 text-eyebrow font-semibold uppercase tracking-[1.2px] text-fg-faint">
                Licence
              </th>
              <th className="px-4 py-3 text-right text-eyebrow font-semibold uppercase tracking-[1.2px] text-fg-faint">
                From
              </th>
              <th className="px-4 py-3">
                <span className="sr-only">Book</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-panel">
            {SERVICE_CATALOGUE.map((service) => (
              <ServiceRow key={service.id} service={service} />
            ))}
            <tr className="border-t border-hairline">
              <th scope="row" className="px-4 py-4 text-left align-top">
                <div className="flex items-start gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-sm border border-hairline text-fg">
                    <ServiceGlyph icon={EX_SERVICEMAN_FILTER.icon} size={16} />
                  </span>
                  <span>
                    <span className="block text-body font-medium text-fg">
                      {EX_SERVICEMAN_FILTER.name}
                    </span>
                    <span className="mt-0.5 block text-label text-fg-faint">Filter, not a category</span>
                  </span>
                </div>
              </th>
              <td className="hidden px-4 py-4 align-top text-body-sm text-fg-mid md:table-cell">
                {EX_SERVICEMAN_FILTER.desc}
              </td>
              <td className="px-4 py-4 align-top text-body-sm text-fg-mid">Verified certificate</td>
              <td className="px-4 py-4 align-top text-right text-body-sm text-fg-faint">—</td>
              <td className="px-4 py-4 align-top text-right">
                <Link
                  href="/book/service?exServiceman=true"
                  className="whitespace-nowrap text-body-sm font-medium text-fg underline-offset-2 hover:underline"
                >
                  Browse
                </Link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}

export type { ServiceCategory };
