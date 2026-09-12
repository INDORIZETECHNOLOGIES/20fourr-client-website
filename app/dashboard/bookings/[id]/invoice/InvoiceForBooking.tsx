"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SubPage } from "@/components/dashboard/SubPage";
import { Card } from "@/components/dashboard/primitives";
import { useApiQuery } from "@/hooks/useApiQuery";
import type {
  ApiBooking,
  InvoiceListResponse,
  TaxDocument,
  TaxDocumentListResponse,
} from "@/lib/api/types";

/**
 * Resolves a booking to its tax documents / v1 invoice.
 */
export function InvoiceForBooking({ bookingId }: { bookingId: string }) {
  const router = useRouter();

  const { data: bookingData, loading: bookingLoading } = useApiQuery<{
    booking: ApiBooking;
  }>(`bookings/${bookingId}`);

  const booking = bookingData?.booking;
  const v6 = booking?.billingEngine === "v6";

  const { data: invoiceData, loading: invoicesLoading } =
    useApiQuery<InvoiceListResponse>("invoices", {
      query: { limit: 100 },
      enabled: !v6,
    });

  const { data: docsData, loading: docsLoading } =
    useApiQuery<TaxDocumentListResponse>("documents", {
      query: { bookingId, limit: 20 },
      enabled: v6,
    });

  const ref = booking?.bookingId;
  const match = ref
    ? invoiceData?.invoices?.find((i) => i.bookingRef === ref || i.bookingId === bookingId)
    : undefined;

  const documents = (docsData?.documents ?? []).filter(
    (d) => d.docType !== "settlement_statement",
  );

  useEffect(() => {
    if (!v6 && match) router.replace(`/dashboard/profile/invoices/${match._id}`);
  }, [match, router, v6]);

  const loading = bookingLoading || invoicesLoading || docsLoading;
  const paid = ["payment_done", "duty_started", "duty_ended", "completed", "settled"].includes(
    booking?.status ?? "",
  );
  const shiftEnded = ["duty_ended", "completed", "settled"].includes(booking?.status ?? "");

  return (
    <SubPage title="Documents" backHref={`/dashboard/bookings/${bookingId}`} backLabel="Booking">
      {loading || (!v6 && match) ? (
        <div className="h-[320px] animate-pulse rounded-lg bg-panel" />
      ) : v6 && documents.length > 0 ? (
        <DocumentList documents={documents} shiftEnded={shiftEnded} />
      ) : (
        <Card className="px-6 py-12 text-center">
          <p className="text-body text-fg-mid">
            {v6 && paid && !shiftEnded
              ? "The platform fee invoice is issued at payment. The service document is issued when the end-of-duty OTP is verified."
              : "No invoice has been issued for this booking yet."}
          </p>
          {!v6 ? (
            <p className="mx-auto mt-2 max-w-[440px] text-body-sm leading-relaxed text-fg-faint">
              An invoice is generated once payment is captured. If you have just paid, give it a
              moment and reload.
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {!v6 ? (
              <a
                href={`/api/bff/client/bookings/${bookingId}/invoice`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-sm border border-edge px-6 py-2.5 text-body font-medium text-fg"
              >
                Open printable invoice
              </a>
            ) : null}
            <Link
              href="/dashboard/profile/invoices"
              className="rounded-sm border border-edge px-6 py-2.5 text-body font-medium text-fg"
            >
              All documents
            </Link>
          </div>
        </Card>
      )}
    </SubPage>
  );
}

function DocumentList({
  documents,
  shiftEnded,
}: {
  documents: TaxDocument[];
  shiftEnded: boolean;
}) {
  const hasService = documents.some(
    (d) => d.docType === "service_tax_invoice" || d.docType === "bill_of_supply",
  );

  return (
    <div className="flex flex-col gap-3">
      {documents.map((d) => (
        <Link
          key={d._id}
          href={`/dashboard/profile/invoices/${d._id}?source=document`}
          className="rounded-lg border border-hairline px-5 py-4 text-body text-fg hover:border-edge"
        >
          <p className="font-medium">{d.documentNumber}</p>
          <p className="mt-1 text-body-sm text-fg-mid">{d.docType.replace(/_/g, " ")}</p>
        </Link>
      ))}
      {!hasService && !shiftEnded ? (
        <p className="text-body-sm text-fg-faint">
          The service document is issued when the end-of-duty OTP is verified.
        </p>
      ) : null}
    </div>
  );
}
