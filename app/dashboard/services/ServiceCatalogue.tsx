"use client";

import Link from "next/link";
import { Card } from "@/components/dashboard/primitives";
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
 * Live catalogue.
 *
 * Each card asks provider search for a single result sorted by price, which
 * gives two real numbers for one request: `pagination.total` is how many
 * providers are actually bookable, and the first card's rate is a genuine
 * "from" price. The old catalogue's rates and booking counts were invented.
 *
 * Deliberately NOT scoped to the client's city. Scoping it looked right, but
 * the API's city filter matches on a derived `serviceCitiesNorm` field that is
 * empty on the current provider records, so every city returns zero — the
 * catalogue would claim "None available" for all four services while 170
 * providers exist. City belongs on the search step, where an empty result is
 * explainable and recoverable.
 */
function ServiceCard({ service }: { service: (typeof SERVICE_CATALOGUE)[number] }) {
  const { data, loading } = useApiQuery<ProviderSearchResponse>("client/providers/search", {
    query: { category: service.id, limit: 1, sortBy: "price" },
  });

  const total = data?.pagination?.total ?? 0;
  const cheapest = data?.providers?.[0]?.pricing;
  const fromHourly = cheapest?.hourlyRate ?? null;
  const fromDaily = cheapest?.dailyRate ?? null;

  return (
    <Card
      className={`flex flex-col p-6 transition-all hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] ${service.hover}`}
    >
      <span
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${service.iconBg} ${service.color}`}
      >
        <ServiceGlyph icon={service.icon} size={22} />
      </span>

      <h3 className="mb-1.5 font-display text-base font-bold text-slate-100">
        {service.name}
      </h3>
      <p className="mb-4 flex-1 text-[12.5px] leading-relaxed text-slate-600">
        {service.desc}
      </p>

      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-sm font-bold text-app-gold">
          {loading ? (
            <span className="inline-block h-4 w-20 animate-pulse rounded bg-white/10" />
          ) : fromHourly ? (
            `From ${formatPaiseRounded(fromHourly)}/hr`
          ) : fromDaily ? (
            `From ${formatPaiseRounded(fromDaily)}/day`
          ) : (
            <span className="text-slate-600">Rates on request</span>
          )}
        </span>
        <span className="shrink-0 text-[11.5px] text-slate-600">
          {loading ? "" : total === 0 ? "None available" : `${total} available`}
        </span>
      </div>

      <Link
        href={`/book/service?category=${service.id}`}
        aria-disabled={total === 0 || undefined}
        className={[
          "block w-full rounded-[10px] border py-2.5 text-center text-[13px] font-bold transition-colors",
          total === 0 && !loading
            ? "pointer-events-none border-white/8 bg-white/3 text-slate-600"
            : "cursor-pointer border-app-gold/25 bg-app-gold/10 text-app-gold hover:bg-app-gold/18",
        ].join(" ")}
      >
        {total === 0 && !loading ? "Unavailable here" : "Book Now"}
      </Link>
    </Card>
  );
}

export function ServiceCatalogue() {
  return (
    <>
      <p className="mb-4 text-[13px] text-slate-500">
        Availability and starting rates across all service cities. Pick a city when you
        book.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {SERVICE_CATALOGUE.map((service) => (
          <ServiceCard key={service.id} service={service} />
        ))}

        {/* A filter, not a category — it books one of the four above with the
            ex-serviceman certificate required, so it links into search with the
            flag set rather than to a category of its own. */}
        <Card
          className={`flex flex-col p-6 transition-all hover:-translate-y-[3px] hover:shadow-[0_8px_24px_rgba(0,0,0,0.3)] ${EX_SERVICEMAN_FILTER.hover}`}
        >
          <span
            className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${EX_SERVICEMAN_FILTER.iconBg} ${EX_SERVICEMAN_FILTER.color}`}
          >
            <ServiceGlyph icon={EX_SERVICEMAN_FILTER.icon} size={22} />
          </span>

          <h3 className="mb-1.5 font-display text-base font-bold text-slate-100">
            {EX_SERVICEMAN_FILTER.name}
          </h3>
          <p className="mb-4 flex-1 text-[12.5px] leading-relaxed text-slate-600">
            {EX_SERVICEMAN_FILTER.desc}
          </p>

          <div className="mb-4">
            <span className="rounded-full bg-white/6 px-3 py-1 text-[11.5px] font-semibold text-slate-400">
              Verified certificate
            </span>
          </div>

          <Link
            href="/book/service?exServiceman=true"
            className="block w-full cursor-pointer rounded-[10px] border border-app-gold/25 bg-app-gold/10 py-2.5 text-center text-[13px] font-bold text-app-gold transition-colors hover:bg-app-gold/18"
          >
            Browse providers
          </Link>
        </Card>
      </div>
    </>
  );
}

export type { ServiceCategory };
