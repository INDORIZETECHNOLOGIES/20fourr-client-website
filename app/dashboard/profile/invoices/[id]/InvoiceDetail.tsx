"use client";

import { SubPage } from "@/components/dashboard/SubPage";
import { Card } from "@/components/dashboard/primitives";
import { useApiQuery } from "@/hooks/useApiQuery";
import { formatApiDate, serviceLabel } from "@/lib/api/adapters";
import type { ApiInvoice } from "@/lib/api/types";
import { formatPaise, formatPaiseRounded } from "@/lib/money";

/** The API sends rates as fractions (0.18); an invoice must read "18%". */
function formatRate(rate: number): string {
  const pct = rate <= 1 ? rate * 100 : rate;
  return `${Number(pct.toFixed(2))}%`;
}

export function InvoiceDetail({ id }: { id: string }) {
  const { data, loading, error } = useApiQuery<{ invoice: ApiInvoice }>(`invoices/${id}`);

  if (loading) {
    return (
      <SubPage title="Invoice" backHref="/dashboard/profile/invoices" backLabel="My Invoices">
        <div className="h-[520px] animate-pulse rounded-2xl bg-app-card" />
      </SubPage>
    );
  }

  if (error || !data?.invoice) {
    return (
      <SubPage title="Invoice" backHref="/dashboard/profile/invoices" backLabel="My Invoices">
        <p
          role="alert"
          className="rounded-2xl border border-red-500/30 bg-red-500/8 px-6 py-10 text-center text-[15px] text-red-300"
        >
          {error ?? "This invoice could not be found."}
        </p>
      </SubPage>
    );
  }

  const inv = data.invoice;
  const lineItems = inv.lineItems ?? [];
  const taxLines = inv.taxLines ?? [];

  return (
    <SubPage
      title={inv.invoiceNumber}
      subtitle={`${serviceLabel(inv.serviceCategory)} · ${formatApiDate(inv.issuedAt)}`}
      backHref="/dashboard/profile/invoices"
      backLabel="My Invoices"
    >
      <Card className="p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-6">
          <div>
            <p className="font-display text-[20px] font-extrabold text-slate-100">20fourr</p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-slate-500">
              PSARA licensed security services
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[1px] text-slate-600">
              Invoice
            </p>
            <p className="text-[15px] font-bold text-slate-100">{inv.invoiceNumber}</p>
            <p className="mt-1 text-[12.5px] text-slate-500">{formatApiDate(inv.issuedAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 border-b border-white/8 py-6 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-slate-600">
              Billed to
            </p>
            {/* The snapshot, not the live profile: an invoice must show who the
                customer was when it was issued, even if they've since changed
                their name or address. */}
            <p className="text-[14px] text-slate-200">{inv.clientSnapshot?.name ?? "—"}</p>
            {inv.clientSnapshot?.email ? (
              <p className="text-[13px] text-slate-500">{inv.clientSnapshot.email}</p>
            ) : null}
            {inv.clientSnapshot?.phone ? (
              <p className="text-[13px] text-slate-500">{inv.clientSnapshot.phone}</p>
            ) : null}
          </div>
          <div>
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-[1px] text-slate-600">
              Booking
            </p>
            <p className="text-[14px] text-slate-200">{inv.bookingRef ?? "—"}</p>
            <p className="text-[13px] text-slate-500">{serviceLabel(inv.serviceCategory)}</p>
            {inv.serviceStartDate ? (
              <p className="text-[13px] text-slate-500">
                {formatApiDate(inv.serviceStartDate)}
                {inv.serviceEndDate && inv.serviceEndDate !== inv.serviceStartDate
                  ? ` – ${formatApiDate(inv.serviceEndDate)}`
                  : ""}
              </p>
            ) : null}
          </div>
        </div>

        <div className="py-6">
          {lineItems.map((item, i) => (
            <div key={i} className="flex items-baseline justify-between gap-4 py-2 text-[14px]">
              <span className="min-w-0 text-slate-400">
                {item.description}
                {item.quantity > 1 ? (
                  <span className="text-slate-600">
                    {" "}
                    × {item.quantity} @ {formatPaise(item.unitPrice)}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-slate-200">{formatPaise(item.amount)}</span>
            </div>
          ))}

          {/* `lineItems` is the complete breakdown and already sums to the
              total — it includes the platform fee and both GST lines. An extra
              "Platform fee" row and a "Subtotal" row double-counted them on
              screen: the invoice showed ₹750 twice and a subtotal that did not
              relate to the lines above it. The tax detail below is presented as
              a breakdown of tax ALREADY included here, not as further charges. */}

          {inv.tcsAmount ? (
            <div className="flex items-baseline justify-between py-2 text-[14px]">
              <span className="text-slate-400">TCS</span>
              <span className="text-slate-200">{formatPaise(inv.tcsAmount)}</span>
            </div>
          ) : null}

          <div className="mt-3 flex items-baseline justify-between border-t border-white/8 pt-4">
            <span className="text-[15px] font-bold text-slate-100">Total</span>
            <span className="font-display text-[24px] font-extrabold text-app-gold">
              {formatPaiseRounded(inv.totalAmount ?? 0)}
            </span>
          </div>
          {/* Every amount is stored exactly in paise, so the lines reconcile —
              this is the unrounded figure. */}
          <p className="mt-2 text-right text-[12px] text-slate-600">
            Exact total {formatPaise(inv.totalAmount ?? 0)}
          </p>

          {/* Presented AFTER the total and labelled as detail, because these
              amounts are already inside the line items above. Each carries its
              own SAC code and rate, and splits into CGST+SGST within a state or
              IGST across states — collapsing that to "GST 18%" would make the
              invoice non-compliant. */}
          {taxLines.length > 0 ? (
            <div className="mt-5 rounded-xl border border-white/8 bg-black/20 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[1px] text-slate-600">
                Tax detail — included in the total above
              </p>
              {taxLines.map((tax, i) => (
                <div key={i} className="mt-3">
                  <div className="flex items-baseline justify-between gap-4 text-[13.5px]">
                    <span className="min-w-0 text-slate-400">
                      {tax.label}
                      <span className="text-slate-600">
                        {" "}· SAC {tax.sac} · {formatRate(tax.rate)}
                      </span>
                    </span>
                    <span className="shrink-0 text-slate-300">{formatPaise(tax.amount)}</span>
                  </div>
                  {tax.split ? (
                    <p className="mt-0.5 text-[12px] text-slate-600">
                      {tax.split.intraState
                        ? `CGST ${formatPaise(tax.split.cgst)} + SGST ${formatPaise(tax.split.sgst)}`
                        : `IGST ${formatPaise(tax.split.igst)}`}
                      {" · place of supply "}
                      {tax.split.placeOfSupplyStateCode}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}

          {inv.reverseChargeApplicable ? (
            <p className="mt-4 rounded-xl border border-app-warning/30 bg-app-warning/8 px-4 py-3 text-[13px] text-app-warning">
              Reverse charge applicable — GST on this supply is payable by the recipient
              under the RCM provisions, not collected by 20fourr.
            </p>
          ) : null}

          {inv.notes ? (
            <p className="mt-4 text-[12.5px] leading-relaxed text-slate-600">{inv.notes}</p>
          ) : null}
        </div>

        <div className="border-t border-white/8 pt-5">
          <a
            href={`/api/bff/invoices/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-full border border-app-gold px-6 py-2.5 text-[14px] font-bold text-app-gold transition-colors hover:bg-app-gold/10"
          >
            Download PDF
          </a>
        </div>
      </Card>
    </SubPage>
  );
}
