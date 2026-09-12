"use client";

import Link from "next/link";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { StatusPill } from "@/components/dashboard/primitives";
import { ChevronRightIcon, ServiceGlyph } from "@/components/dashboard/icons";
import { useSession } from "@/components/session/SessionProvider";
import { useApiQuery } from "@/hooks/useApiQuery";
import { adaptBooking } from "@/lib/api/adapters";
import type { BookingListResponse, ProviderSearchResponse } from "@/lib/api/types";
import { quoteFromBooking } from "@/lib/api/pricing";
import { QuoteBreakdown } from "@/app/book/PriceSummary";
import { ONGOING_STATUSES, type BookingStatus } from "@/lib/dashboard-data";
import { SERVICE_CATALOGUE } from "@/lib/services";
import { formatPaiseRounded } from "@/lib/money";

export function Greeting() {
  const { profile } = useSession();
  const { nextBooking } = useOverview();

  return (
    <>
      <h2 className="text-h2 text-fg">{profile?.name ?? "Account"}</h2>
      {nextBooking ? (
        <p className="mt-2 max-w-prose text-body text-fg-mid">
          Next booking {nextBooking.date} with {nextBooking.guard || nextBooking.service}.
        </p>
      ) : (
        <p className="mt-2 max-w-prose text-body text-fg-mid">
          No upcoming bookings.{" "}
          <Link href="/book" className="font-medium text-fg underline">
            Book a guard
          </Link>
        </p>
      )}
    </>
  );
}

const UPCOMING_STATUSES: BookingStatus[] = [
  "pending",
  "provider_accepted",
  "payment_pending",
  "payment_done",
];

type OverviewValue = ReturnType<typeof buildOverview>;

const OverviewContext = createContext<OverviewValue | null>(null);

function useOverview(): OverviewValue {
  const value = useContext(OverviewContext);
  if (!value) throw new Error("useOverview must be used inside <OverviewProvider>");
  return value;
}

/**
 * Stats and the recent-bookings table, both derived from one booking list.
 *
 * They sit in different parts of the page, so the query lives in a provider
 * rather than in each of them — otherwise the dashboard would fetch the same
 * list twice on every load.
 *
 * The four tiles are counted here rather than fetched: the API has no summary
 * endpoint, and four filtered requests to produce four integers would cost more
 * than counting a list the table below already needs.
 */
export function OverviewProvider({ children }: { children: ReactNode }) {
  const { data, loading, error } = useApiQuery<BookingListResponse>("client/bookings", {
    query: { limit: 100 },
  });

  const value = useMemo(() => buildOverview(data, loading, error), [data, loading, error]);

  return <OverviewContext.Provider value={value}>{children}</OverviewContext.Provider>;
}

function buildOverview(
  data: BookingListResponse | null,
  loading: boolean,
  error: string | null,
) {
  const source = data?.bookings ?? [];
  const bookings = source.map(adaptBooking);
  const count = (statuses: BookingStatus[]) =>
    bookings.filter((b) => statuses.includes(b.status)).length;

  const nextBooking = bookings.find((b) => UPCOMING_STATUSES.includes(b.status)) ?? null;

  const stats = [
    {
      label: "Upcoming",
      value: count(UPCOMING_STATUSES),
      live: false,
    },
    {
      label: "On duty",
      value: count(["duty_started"]),
      live: true,
    },
    {
      label: "Ongoing",
      value: count(ONGOING_STATUSES),
      live: false,
    },
    {
      label: "All bookings",
      value: data?.pagination?.total ?? bookings.length,
      live: false,
    },
  ];

  return {
    stats,
    bookings: bookings.slice(0, 4),
    recentSource: source.slice(0, 4),
    nextBooking,
    loading,
    error,
  };
}

export function StatTiles() {
  const { stats, loading } = useOverview();

  return (
    <div className="mb-6 grid grid-cols-2 border-y border-hairline xl:grid-cols-4">
      {stats.map(({ label, value, live }, i) => (
        <div
          key={label}
          className={[
            "px-4 py-5",
            i < stats.length - 1 ? "xl:border-r xl:border-hairline" : "",
            i % 2 === 0 ? "border-r border-hairline xl:border-r" : "",
            i < 2 ? "border-b border-hairline xl:border-b-0" : "",
          ].join(" ")}
        >
          <p className="text-label text-fg-faint">{label}</p>
          <p
            className={[
              "mt-2 text-mono-lg",
              live && value > 0 ? "text-live" : "text-fg",
            ].join(" ")}
          >
            {loading ? <Skeleton /> : value}
          </p>
          {live && !loading && value > 0 ? (
            <p className="mt-1 flex items-center gap-1.5 text-body-sm text-live">
              <span className="animate-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-live" />
              On duty
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function RecentBookings() {
  const { bookings, recentSource, loading, error } = useOverview();

  if (loading) {
    return (
      <div className="flex flex-col gap-[3px]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[52px] animate-pulse rounded-sm bg-panel-raised" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="px-3 py-6 text-center text-body-sm text-fault">
        {error}
      </p>
    );
  }

  if (bookings.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-body-sm text-fg-faint">
        No bookings yet.{" "}
        <Link href="/book" className="font-medium text-fg underline">
          Book a service
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-[3px]">
      {bookings.map((bk, i) => {
        const src = recentSource[i];
        const quote = src ? quoteFromBooking(src) : null;
        return (
        <Link
          key={bk.id}
          href={`/dashboard/bookings/${bk.id}`}
          className="grid grid-cols-[1fr_auto_auto] items-start gap-2 rounded-sm px-3 py-2.5 transition-colors hover:bg-panel-raised"
        >
          <span className="min-w-0">
            <span className="block truncate text-body-sm font-semibold text-fg">
              {bk.service}
            </span>
            <span className="mt-0.5 block text-label text-fg-faint">
              {bk.date} · {bk.time}
            </span>
          </span>
          <StatusPill status={bk.status} className="min-w-[75px] text-center" />
          <span className="min-w-[140px] text-right text-fg">
            {quote ? (
              <QuoteBreakdown quote={quote} compact />
            ) : (
              <span className="text-mono text-body-sm tabular-nums">
                {formatPaiseRounded(bk.amountPaise)}
              </span>
            )}
          </span>
        </Link>
        );
      })}
    </div>
  );
}

function Skeleton(): ReactNode {
  return <span className="inline-block h-[30px] w-10 animate-pulse rounded bg-panel-raised" />;
}

/**
 * The dashboard's compact service list.
 *
 * Was `FEATURED_SERVICES` — six invented services with invented rates and
 * booking counts, three of which ("Event Security", "Personal Guard",
 * "Corporate Security") the API has no category for at all. Now the four real
 * categories, with a live provider count and a real starting rate each.
 */
export function ServiceShortlist() {
  return (
    <div className="flex flex-col gap-2">
      {SERVICE_CATALOGUE.map((svc) => (
        <ServiceShortlistRow key={svc.id} service={svc} />
      ))}
    </div>
  );
}

function ServiceShortlistRow({ service }: { service: (typeof SERVICE_CATALOGUE)[number] }) {
  const { data, loading } = useApiQuery<ProviderSearchResponse>("client/providers/search", {
    query: { category: service.id, limit: 1, sortBy: "price" },
  });

  const total = data?.pagination?.total ?? 0;
  const pricing = data?.providers?.[0]?.pricing;
  const rate = pricing?.hourlyRate
    ? `${formatPaiseRounded(pricing.hourlyRate)}/hr`
    : pricing?.dailyRate
      ? `${formatPaiseRounded(pricing.dailyRate)}/day`
      : null;

  return (
    <Link
      href={`/book/service?category=${service.id}`}
      className="flex items-center gap-3 rounded-sm border-b border-hairline px-1 py-3 last:border-b-0 hover:bg-panel-raised"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-sm border border-hairline text-fg">
        <ServiceGlyph icon={service.icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-body-sm font-semibold text-fg">
          {service.name}
        </span>
        <span className="mt-0.5 block text-label text-fg-faint">
          {loading ? "Checking availability…" : rate ? `From ${rate} · ` : ""}
          {loading ? "" : `${total} available`}
        </span>
      </span>
      <span className="shrink-0 text-fg-faint">
        <ChevronRightIcon />
      </span>
    </Link>
  );
}
