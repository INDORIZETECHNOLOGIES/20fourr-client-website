"use client";

import { useState } from "react";
import { Card, StatusPill } from "@/components/dashboard/primitives";
import { ListRow } from "@/components/dashboard/ListRow";
import {
  CalendarIcon,
  ClockIcon,
  PinIcon,
  ServiceGlyph,
  UserIcon,
} from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { adaptBooking } from "@/lib/api/adapters";
import type { BookingListResponse } from "@/lib/api/types";
import {
  BOOKING_TABS,
  TAB_STATUSES,
  statusStyle,
  type BookingStatus,
  type BookingTab,
} from "@/lib/dashboard-data";
import { SERVICE_CATALOGUE } from "@/lib/services";
import { formatPaiseRounded } from "@/lib/money";

export function BookingsList() {
  const [tab, setTab] = useState<BookingTab>("ongoing");

  // One request for the whole list, grouped into tabs here. The API's `status`
  // filter takes a single value, but every tab covers several — Ongoing alone
  // spans seven — so filtering server-side would mean seven round trips per tab.
  const { data, loading, error, refetch } = useApiQuery<BookingListResponse>(
    "client/bookings",
    { query: { limit: 100 } },
  );

  const all = (data?.bookings ?? []).map(adaptBooking);
  const bookings = all.filter((b) => TAB_STATUSES[tab].includes(b.status as BookingStatus));

  return (
    <>
      <div
        role="tablist"
        aria-label="Booking status"
        className="mb-[22px] flex w-fit max-w-full gap-1 overflow-x-auto rounded-[10px] bg-white/4 p-1"
      >
        {BOOKING_TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={[
              "shrink-0 cursor-pointer rounded-[7px] px-5 py-2 text-[13px] font-semibold transition-all sm:px-[22px]",
              tab === id
                ? "bg-app-gold/12 text-app-gold"
                : "bg-transparent text-slate-500 hover:text-slate-400",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-[86px] animate-pulse rounded-2xl border border-white/6 bg-app-card"
            />
          ))}
        </div>
      ) : error ? (
        <Card className="px-6 py-14 text-center">
          <p role="alert" className="text-sm text-red-300">
            {error}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-full border border-app-gold px-6 py-2.5 text-[13px] font-bold text-app-gold"
          >
            Try again
          </button>
        </Card>
      ) : bookings.length === 0 ? (
        <Card className="px-6 py-14 text-center">
          <p className="text-sm text-slate-500">
            No {BOOKING_TABS.find((t) => t.id === tab)?.label.toLowerCase()} bookings.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {bookings.map((bk) => {
            const service = SERVICE_CATALOGUE.find((s) => s.id === bk.category);
            const style = statusStyle(bk.status);
            // Dimming is for pushing a dead booking behind live ones. In the
            // Cancelled tab everything is dead, so dimming the whole list just
            // makes the page look broken.
            const terminal =
              tab !== "cancelled" &&
              (bk.status === "cancelled" || bk.status === "provider_rejected");

            return (
              <ListRow
                key={bk.id}
                href={`/dashboard/bookings/${bk.id}`}
                accent={style.color}
                muted={terminal}
                icon={<ServiceGlyph icon={service?.icon ?? "shield"} size={19} />}
                iconClass={
                  service ? `${service.iconBg} ${service.color}` : "bg-app-gold/12 text-app-gold"
                }
                title={bk.service}
                badge={<StatusPill status={bk.status} />}
                primaryMeta={[
                  { icon: <CalendarIcon size={12} />, text: bk.date },
                  { icon: <ClockIcon size={12} />, text: bk.time },
                ]}
                secondaryMeta={[
                  { icon: <PinIcon size={12} />, text: bk.location, flexible: true },
                  { icon: <UserIcon size={12} />, text: bk.guard },
                ]}
                amount={formatPaiseRounded(bk.amountPaise)}
                reference={bk.ref ?? bk.id}
              />
            );
          })}
        </div>
      )}
    </>
  );
}

