"use client";

import { SubPage } from "@/components/dashboard/SubPage";
import { RateForm } from "./RateForm";
import { useApiQuery } from "@/hooks/useApiQuery";
import { adaptBooking, providerName } from "@/lib/api/adapters";
import type { ApiBooking } from "@/lib/api/types";

/**
 * Fetches the booking so the form has the two things the API insists on: the
 * booking id and `toUserId`, the provider being rated.
 */
export function RatePageClient({ id }: { id: string }) {
  const { data, loading, error } = useApiQuery<{ booking: ApiBooking }>(`bookings/${id}`);

  if (loading) {
    return (
      <SubPage title="Rate Your Experience" backHref={`/dashboard/bookings/${id}`} backLabel="Booking" width={620}>
        <div className="h-[420px] animate-pulse rounded-lg border border-hairline bg-panel" />
      </SubPage>
    );
  }

  if (error || !data?.booking) {
    return (
      <SubPage title="Rate Your Experience" backHref={`/dashboard/bookings/${id}`} backLabel="Booking" width={620}>
        <p role="alert" className="rounded-lg border border-fault bg-transparent px-6 py-10 text-center text-body text-fault">
          {error ?? "This booking could not be found."}
        </p>
      </SubPage>
    );
  }

  const booking = data.booking;
  const view = adaptBooking(booking);
  const provider = booking.providerId;
  const providerUserId =
    typeof provider === "string" ? provider : (provider?._id ?? null);

  return (
    <SubPage
      title="Rate Your Experience"
      subtitle={`${view.service} · ${providerName(booking)} · ${view.date}`}
      backHref={`/dashboard/bookings/${id}`}
      backLabel="Booking"
      width={620}
    >
      <RateForm
        guard={providerName(booking)}
        bookingId={booking._id}
        providerUserId={providerUserId}
      />
    </SubPage>
  );
}
