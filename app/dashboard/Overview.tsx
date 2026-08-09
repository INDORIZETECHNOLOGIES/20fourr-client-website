"use client";

import Link from "next/link";
import { createContext, useContext, useMemo, type ReactNode } from "react";
import { Card, StatusPill } from "@/components/dashboard/primitives";
import {
  ActivityIcon,
  CalendarIcon,
  ChevronRightIcon,
  ChevronUpIcon,
  ServiceGlyph,
  ShieldIcon,
  StarFill,
} from "@/components/dashboard/icons";
import { useSession } from "@/components/session/SessionProvider";
import { useApiQuery } from "@/hooks/useApiQuery";
import { adaptBooking } from "@/lib/api/adapters";
import type { BookingListResponse, ProviderSearchResponse } from "@/lib/api/types";
import { ONGOING_STATUSES, type BookingStatus } from "@/lib/dashboard-data";
import { SERVICE_CATALOGUE } from "@/lib/services";
import { formatPaiseRounded } from "@/lib/money";

/** Greeting by local clock — the design hardcoded "Good Afternoon". */
function partOfDay(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export function Greeting() {
  const { profile } = useSession();

  return (
    <>
      <p className="mb-1.5 text-xs uppercase tracking-[0.5px] text-slate-500">
        {partOfDay()}
      </p>
      <h2 className="mb-2 font-display text-[22px] font-extrabold tracking-[-0.5px] text-slate-100 sm:text-[26px]">
        Welcome back{profile?.name ? `, ${profile.name}` : ""} 👋
      </h2>
      <p className="max-w-[380px] text-[13.5px] leading-relaxed text-slate-600">
        Your 24/7 security command center. Protect what matters most.
      </p>
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
  const bookings = (data?.bookings ?? []).map(adaptBooking);
  const count = (statuses: BookingStatus[]) =>
    bookings.filter((b) => statuses.includes(b.status)).length;

  const stats = [
    {
      label: "Upcoming",
      value: count(UPCOMING_STATUSES),
      Icon: CalendarIcon,
      tint: "bg-app-info/12 text-app-info",
      footer: (
        <span className="flex items-center gap-1 text-slate-600">
          <ChevronUpIcon />
          Awaiting duty start
        </span>
      ),
    },
    {
      label: "Active",
      value: count(["duty_started"]),
      Icon: ShieldIcon,
      tint: "bg-green-500/12 text-green-500",
      footer: (
        <span className="flex items-center gap-1.5 text-green-500">
          <span className="animate-pulse-dot inline-block h-1.5 w-1.5 rounded-full bg-green-500" />
          Live right now
        </span>
      ),
    },
    {
      label: "Ongoing",
      value: count(ONGOING_STATUSES),
      Icon: StarFill,
      tint: "bg-app-gold/12 text-app-gold",
      footer: <span className="text-app-gold">In flight</span>,
    },
    {
      label: "Total Bookings",
      value: data?.pagination?.total ?? bookings.length,
      Icon: ActivityIcon,
      tint: "bg-violet-400/12 text-violet-400",
      footer: <span className="text-slate-600">Lifetime bookings</span>,
    },
  ];

  return { stats, bookings: bookings.slice(0, 4), loading, error };
}

export function StatTiles() {
  const { stats, loading } = useOverview();

  return (
    <div className="mb-[22px] grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
      {stats.map(({ label, value, Icon, tint, footer }) => (
        <Card key={label} className="px-5 py-[18px]">
          <div className="mb-3.5 flex items-center justify-between">
            <span className="text-xs font-medium text-slate-600">{label}</span>
            <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${tint}`}>
              <Icon size={14} />
            </span>
          </div>
          <p className="mb-1.5 font-display text-[30px] font-extrabold leading-none text-slate-100">
            {loading ? <Skeleton /> : value}
          </p>
          <div className="text-[11.5px]">{footer}</div>
        </Card>
      ))}
    </div>
  );
}

export function RecentBookings() {
  const { bookings, loading, error } = useOverview();

  if (loading) {
    return (
      <div className="flex flex-col gap-[3px]">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-[52px] animate-pulse rounded-[9px] bg-white/4" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <p role="alert" className="px-3 py-6 text-center text-[13px] text-red-300">
        {error}
      </p>
    );
  }

  if (bookings.length === 0) {
    return (
      <p className="px-3 py-8 text-center text-[13px] text-slate-600">
        No bookings yet.{" "}
        <Link href="/book" className="font-semibold text-app-gold hover:underline">
          Book your first service
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-[3px]">
      {bookings.map((bk) => (
        <Link
          key={bk.id}
          href={`/dashboard/bookings/${bk.id}`}
          className="grid grid-cols-[1fr_auto_auto] items-center gap-2 rounded-[9px] px-3 py-2.5 transition-colors hover:bg-white/3"
        >
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-slate-200">
              {bk.service}
            </span>
            <span className="mt-0.5 block text-[11.5px] text-slate-700">
              {bk.date} · {bk.time}
            </span>
          </span>
          <StatusPill status={bk.status} className="min-w-[75px] text-center" />
          <span className="min-w-[55px] text-right text-[13px] font-bold text-slate-100">
            {formatPaiseRounded(bk.amountPaise)}
          </span>
        </Link>
      ))}
    </div>
  );
}

function Skeleton(): ReactNode {
  return <span className="inline-block h-[30px] w-10 animate-pulse rounded bg-white/8" />;
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
      className={`flex items-center gap-3 rounded-[11px] border border-transparent bg-white/3 px-3.5 py-3 transition-all ${service.hover} hover:bg-white/5`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] ${service.iconBg} ${service.color}`}
      >
        <ServiceGlyph icon={service.icon} size={18} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-semibold text-slate-100">
          {service.name}
        </span>
        <span className="mt-0.5 block text-[11.5px] text-slate-600">
          {loading ? "Checking availability…" : rate ? `From ${rate} · ` : ""}
          {loading ? "" : `${total} available`}
        </span>
      </span>
      <span className="shrink-0 text-slate-700">
        <ChevronRightIcon />
      </span>
    </Link>
  );
}
