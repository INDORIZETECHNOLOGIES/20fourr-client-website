"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SubPage } from "@/components/dashboard/SubPage";
import { Card } from "@/components/dashboard/primitives";
import { useApiQuery } from "@/hooks/useApiQuery";
import type { ApiBooking, InvoiceListResponse } from "@/lib/api/types";

/**
 * Resolves a booking to its invoice.
 *
 * There is no "invoice by booking id" endpoint that returns the stored Invoice
 * document — `/client/bookings/:id/invoice-data` composes one on the fly, and
 * `/client/bookings/:id/invoice` returns HTML. The real record is only
 * reachable through the invoice list, so this matches on `bookingRef` and hands
 * off to the existing invoice screen rather than rendering a second, subtly
 * different version of the same document.
 */
export function InvoiceForBooking({ bookingId }: { bookingId: string }) {
  const router = useRouter();

  const { data: bookingData, loading: bookingLoading } = useApiQuery<{
    booking: ApiBooking;
  }>(`bookings/${bookingId}`);

  const { data: invoiceData, loading: invoicesLoading } =
    useApiQuery<InvoiceListResponse>("invoices", { query: { limit: 100 } });

  const ref = bookingData?.booking?.bookingId;
  const match = ref
    ? invoiceData?.invoices?.find((i) => i.bookingRef === ref || i.bookingId === bookingId)
    : undefined;

  useEffect(() => {
    if (match) router.replace(`/dashboard/profile/invoices/${match._id}`);
  }, [match, router]);

  const loading = bookingLoading || invoicesLoading;

  return (
    <SubPage
      title="Invoice"
      backHref={`/dashboard/bookings/${bookingId}`}
      backLabel="Booking"
    >
      {loading || match ? (
        <div className="h-[320px] animate-pulse rounded-2xl bg-app-card" />
      ) : (
        <Card className="px-6 py-12 text-center">
          <p className="text-[15px] text-slate-300">
            No invoice has been issued for this booking yet.
          </p>
          <p className="mx-auto mt-2 max-w-[440px] text-[13.5px] leading-relaxed text-slate-500">
            An invoice is generated once payment is captured. If you have just paid, give
            it a moment and reload.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {/* The API's own printable copy, straight from the booking. */}
            <a
              href={`/api/bff/client/bookings/${bookingId}/invoice`}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full border border-app-gold px-6 py-2.5 text-[14px] font-bold text-app-gold"
            >
              Open printable invoice
            </a>
            <Link
              href="/dashboard/profile/invoices"
              className="rounded-full border border-app-border px-6 py-2.5 text-[14px] font-semibold text-slate-300"
            >
              All invoices
            </Link>
          </div>
        </Card>
      )}
    </SubPage>
  );
}
