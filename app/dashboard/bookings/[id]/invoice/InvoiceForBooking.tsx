"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { SubPage } from "@/components/dashboard/SubPage";
import { Card } from "@/components/dashboard/primitives";
import { useApiQuery } from "@/hooks/useApiQuery";
import { formatPaise } from "@/lib/money";
import { INVOICE_DOWNLOAD_STATUSES, invoicesAvailable } from "@/lib/api/types";
import type {
  ApiBooking,
  InvoiceListResponse,
  ProviderInvoiceView,
  TaxDocument,
  TaxDocumentListResponse,
} from "@/lib/api/types";

const DOC_LABELS: Record<string, string> = {
  platform_fee_invoice: "Platform fee invoice",
  platform_credit_note: "Platform fee credit note",
  service_tax_invoice: "Service tax invoice",
  bill_of_supply: "Bill of supply",
  service_credit_note: "Service credit note",
};

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/**
 * Resolves a booking to its invoices.
 *
 * v6: two invoices from two suppliers, so the client can claim GST input
 * credit on each. 20fourr's platform fee invoice is issued at payment and
 * shown from then on; the provider's own invoice for the service appears once
 * the provider uploads it after the work is complete.
 *
 * v1: the single legacy invoice, redirected to its detail page.
 */
export function InvoiceForBooking({ bookingId }: { bookingId: string }) {
  const router = useRouter();

  const { data: bookingData, loading: bookingLoading } = useApiQuery<{
    booking: ApiBooking;
  }>(`bookings/${bookingId}`);

  const booking = bookingData?.booking;
  const v6 = booking?.billingEngine === "v6";
  // Direct URLs must obey the same gate as the booking screen's button.
  const available = booking ? invoicesAvailable(booking) : false;
  const workComplete = INVOICE_DOWNLOAD_STATUSES.includes(booking?.status ?? "");

  const { data: invoiceData, loading: invoicesLoading } =
    useApiQuery<InvoiceListResponse>("invoices", {
      query: { limit: 100 },
      enabled: !v6 && available,
    });

  const { data: docsData, loading: docsLoading } =
    useApiQuery<TaxDocumentListResponse>("documents", {
      query: { bookingId, limit: 20 },
      enabled: v6 && available,
    });

  const { data: providerInvoiceData, loading: providerInvoiceLoading } =
    useApiQuery<ProviderInvoiceView>(`bookings/${bookingId}/provider-invoice`, {
      enabled: v6 && available,
    });

  const ref = booking?.bookingId;
  const match = ref && available && !v6
    ? invoiceData?.invoices?.find((i) => i.bookingRef === ref || i.bookingId === bookingId)
    : undefined;

  useEffect(() => {
    if (match) router.replace(`/dashboard/profile/invoices/${match._id}`);
  }, [match, router]);

  const loading =
    bookingLoading ||
    (available && (v6 ? docsLoading || providerInvoiceLoading : invoicesLoading));

  if (loading || match) {
    return (
      <SubPage title="Invoices" backHref={`/dashboard/bookings/${bookingId}`} backLabel="Booking">
        <div className="h-[320px] animate-pulse rounded-lg bg-panel" />
      </SubPage>
    );
  }

  if (!available || !v6) {
    return (
      <SubPage title="Invoice" backHref={`/dashboard/bookings/${bookingId}`} backLabel="Booking">
        <Card className="px-6 py-12 text-center">
          <p className="text-body text-fg-mid">
            {!available
              ? v6
                ? "Invoices are available once the booking is paid."
                : "The invoice is available once the work is complete."
              : "No invoice has been issued for this booking yet."}
          </p>
          {!v6 && available ? (
            <p className="mx-auto mt-2 max-w-[440px] text-body-sm leading-relaxed text-fg-faint">
              An invoice is generated once payment is captured. If you have just paid, give it a
              moment and reload.
            </p>
          ) : null}
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            {!v6 && available ? (
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
      </SubPage>
    );
  }

  const documents = (docsData?.documents ?? []).filter(
    (d) => d.docType !== "settlement_statement",
  );
  // Bookings from before providers uploaded their own invoices carry a
  // service document issued by 20fourr on the provider's behalf.
  const platformDocs = documents.filter((d) => d.issuer?.party !== "provider");
  const legacyServiceDocs = documents.filter((d) => d.issuer?.party === "provider");
  const providerInvoice = providerInvoiceData?.providerInvoice ?? null;

  return (
    <SubPage title="Invoices" backHref={`/dashboard/bookings/${bookingId}`} backLabel="Booking">
      <div className="flex flex-col gap-6">
        <p className="max-w-[560px] text-body-sm leading-relaxed text-fg-mid">
          This booking has two invoices: one from 20fourr for the platform fee, and one from the
          provider for the security service. Each carries its own GST, so keep both for your input
          tax credit.
        </p>

        <section>
          <h2 className="text-body font-semibold text-fg">20fourr platform fee</h2>
          <p className="mt-1 text-body-sm text-fg-faint">Issued when you paid.</p>
          <div className="mt-3 flex flex-col gap-3">
            {platformDocs.length > 0 ? (
              platformDocs.map((d) => <DocumentLink key={d._id} doc={d} />)
            ) : (
              <p className="rounded-lg border border-hairline px-5 py-4 text-body-sm text-fg-mid">
                The platform fee invoice is being issued. If you have just paid, give it a moment and
                reload.
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-body font-semibold text-fg">Provider&apos;s invoice</h2>
          <p className="mt-1 text-body-sm text-fg-faint">
            Issued by the provider for the security service, after the work is complete.
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {providerInvoice ? (
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-hairline px-5 py-4">
                <div>
                  <p className="font-medium text-body text-fg">{providerInvoice.invoiceNumber}</p>
                  <p className="mt-1 text-body-sm text-fg-mid">
                    {providerInvoiceData?.expected.documentKind === "bill_of_supply"
                      ? "Bill of supply"
                      : "Tax invoice"}{" "}
                    · {formatDay(providerInvoice.invoiceDate)} ·{" "}
                    {formatPaise(providerInvoice.totalPaise)}
                  </p>
                </div>
                {providerInvoice.fileUrl ? (
                  <a
                    href={providerInvoice.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-sm border border-edge px-5 py-2 text-body-sm font-medium text-fg"
                  >
                    Download
                  </a>
                ) : null}
              </div>
            ) : legacyServiceDocs.length > 0 ? (
              legacyServiceDocs.map((d) => <DocumentLink key={d._id} doc={d} />)
            ) : (
              <p className="rounded-lg border border-hairline px-5 py-4 text-body-sm text-fg-mid">
                {workComplete
                  ? "Waiting for the provider to upload their invoice. It will appear here, and you'll get a notification."
                  : "The provider uploads their invoice once the work is complete."}
              </p>
            )}
          </div>
        </section>
      </div>
    </SubPage>
  );
}

function DocumentLink({ doc }: { doc: TaxDocument }) {
  return (
    <Link
      href={`/dashboard/profile/invoices/${doc._id}?source=document`}
      className="rounded-lg border border-hairline px-5 py-4 text-body text-fg hover:border-edge"
    >
      <p className="font-medium">{doc.documentNumber}</p>
      <p className="mt-1 text-body-sm text-fg-mid">
        {DOC_LABELS[doc.docType] ?? doc.docType.replace(/_/g, " ")}
        {doc.issuedAt ? ` · ${formatDay(doc.issuedAt)}` : ""}
        {typeof doc.totalPaise === "number" ? ` · ${formatPaise(doc.totalPaise)}` : ""}
      </p>
    </Link>
  );
}
