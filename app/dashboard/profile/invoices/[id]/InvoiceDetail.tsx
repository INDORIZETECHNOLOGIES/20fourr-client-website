"use client";

import { SubPage } from "@/components/dashboard/SubPage";
import { Card } from "@/components/dashboard/primitives";
import { useApiQuery, type QueryResult } from "@/hooks/useApiQuery";
import { formatApiDate, serviceLabel } from "@/lib/api/adapters";
import type { ApiInvoice, TaxDocument } from "@/lib/api/types";
import { formatPaise, formatPaiseRounded } from "@/lib/money";

/**
 * `issuer`/`recipient` carry a `party` enum ('platform' | 'client' | 'provider')
 * and only sometimes a name. Rendering the raw enum printed "platform" and
 * "client" as the two parties to a tax invoice, which is not what a document
 * naming its supplier and recipient should say.
 */
const PARTY_LABEL: Record<string, string> = {
  platform: "20fourr",
  client: "You",
  provider: "Security provider",
};

function partyLabel(party?: { name?: string; party?: string } | null): string {
  if (party?.name) return party.name;
  const key = party?.party;
  return (key && PARTY_LABEL[key]) || key || "—";
}

/** The API sends rates as fractions (0.18); an invoice must read "18%". */
function formatRate(rate: number): string {
  const pct = rate <= 1 ? rate * 100 : rate;
  return `${Number(pct.toFixed(2))}%`;
}

export function InvoiceDetail({
  id,
  source = "invoice",
}: {
  id: string;
  source?: "invoice" | "document";
}) {
  const invoiceQ = useApiQuery<{ invoice: ApiInvoice }>(`invoices/${id}`, {
    enabled: source === "invoice",
  });
  const docQ = useApiQuery<{ document?: TaxDocument } & TaxDocument>(
    `documents/${id}`,
    { enabled: source === "document" },
  );

  if (source === "document") {
    return <TaxDocumentView id={id} query={docQ} />;
  }

  const { data, loading, error } = invoiceQ;

  if (loading) {
    return (
      <SubPage title="Invoice" backHref="/dashboard/profile/invoices" backLabel="My Invoices">
        <div className="h-[520px] animate-pulse rounded-lg bg-panel" />
      </SubPage>
    );
  }

  if (error || !data?.invoice) {
    return (
      <SubPage title="Invoice" backHref="/dashboard/profile/invoices" backLabel="My Invoices">
        <p
          role="alert"
          className="rounded-lg border border-fault bg-transparent px-6 py-10 text-center text-body text-fault"
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
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-hairline pb-6">
          <div>
            <p className="font-sans text-mono-lg font-semibold text-fg">20fourr</p>
            <p className="mt-1 text-body-sm leading-relaxed text-fg-faint">
              PSARA licensed security services
            </p>
          </div>
          <div className="text-right">
            <p className="text-eyebrow font-semibold uppercase tracking-[1px] text-fg-faint">
              Invoice
            </p>
            <p className="text-body font-semibold text-fg">{inv.invoiceNumber}</p>
            <p className="mt-1 text-body-sm text-fg-faint">{formatApiDate(inv.issuedAt)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 border-b border-hairline py-6 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-eyebrow font-semibold uppercase tracking-[1px] text-fg-faint">
              Billed to
            </p>
            {/* The snapshot, not the live profile: an invoice must show who the
                customer was when it was issued, even if they've since changed
                their name or address. */}
            <p className="text-body text-fg">{inv.clientSnapshot?.name ?? "—"}</p>
            {inv.clientSnapshot?.email ? (
              <p className="text-body-sm text-fg-faint">{inv.clientSnapshot.email}</p>
            ) : null}
            {inv.clientSnapshot?.phone ? (
              <p className="text-body-sm text-fg-faint">{inv.clientSnapshot.phone}</p>
            ) : null}
          </div>
          <div>
            <p className="mb-1.5 text-eyebrow font-semibold uppercase tracking-[1px] text-fg-faint">
              Booking
            </p>
            <p className="text-body text-fg">{inv.bookingRef ?? "—"}</p>
            <p className="text-body-sm text-fg-faint">{serviceLabel(inv.serviceCategory)}</p>
            {inv.serviceStartDate ? (
              <p className="text-body-sm text-fg-faint">
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
            <div key={i} className="flex items-baseline justify-between gap-4 py-2 text-body">
              <span className="min-w-0 text-fg-mid">
                {item.description}
                {item.quantity > 1 ? (
                  <span className="text-fg-faint">
                    {" "}
                    × {item.quantity} @ {formatPaise(item.unitPrice)}
                  </span>
                ) : null}
              </span>
              <span className="shrink-0 text-fg">{formatPaise(item.amount)}</span>
            </div>
          ))}

          {/* `lineItems` is the complete breakdown and already sums to the
              total — it includes the platform fee and both GST lines. An extra
              "Platform fee" row and a "Subtotal" row double-counted them on
              screen: the invoice showed ₹750 twice and a subtotal that did not
              relate to the lines above it. The tax detail below is presented as
              a breakdown of tax ALREADY included here, not as further charges. */}

          {inv.tcsAmount ? (
            <div className="flex items-baseline justify-between py-2 text-body">
              <span className="text-fg-mid">TCS</span>
              <span className="text-fg">{formatPaise(inv.tcsAmount)}</span>
            </div>
          ) : null}

          <div className="mt-3 flex items-baseline justify-between border-t border-hairline pt-4">
            <span className="text-body font-semibold text-fg">Total</span>
            <span className="text-mono-lg tabular-nums text-fg">
              {formatPaiseRounded(inv.totalAmount ?? 0)}
            </span>
          </div>
          {/* Every amount is stored exactly in paise, so the lines reconcile —
              this is the unrounded figure. */}
          <p className="mt-2 text-right text-label text-fg-faint">
            Exact total {formatPaise(inv.totalAmount ?? 0)}
          </p>

          {/* Presented AFTER the total and labelled as detail, because these
              amounts are already inside the line items above. Each carries its
              own SAC code and rate, and splits into CGST+SGST within a state or
              IGST across states — collapsing that to "GST 18%" would make the
              invoice non-compliant. */}
          {taxLines.length > 0 ? (
            <div className="mt-5 rounded-lg border border-hairline bg-panel-raised p-4">
              <p className="text-eyebrow font-semibold uppercase tracking-[1px] text-fg-faint">
                Tax detail — included in the total above
              </p>
              {taxLines.map((tax, i) => (
                <div key={i} className="mt-3">
                  <div className="flex items-baseline justify-between gap-4 text-body-sm">
                    <span className="min-w-0 text-fg-mid">
                      {tax.label}
                      <span className="text-fg-faint">
                        {" "}· SAC {tax.sac} · {formatRate(tax.rate)}
                      </span>
                    </span>
                    <span className="shrink-0 text-fg-mid">{formatPaise(tax.amount)}</span>
                  </div>
                  {tax.split ? (
                    <p className="mt-0.5 text-label text-fg-faint">
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
            <p className="mt-4 rounded-lg border border-attention bg-transparent px-4 py-3 text-body-sm text-attention">
              Reverse charge applicable — GST on this supply is payable by the recipient
              under the RCM provisions, not collected by 20fourr.
            </p>
          ) : null}

          {inv.notes ? (
            <p className="mt-4 text-body-sm leading-relaxed text-fg-faint">{inv.notes}</p>
          ) : null}
        </div>

        <div className="border-t border-hairline pt-5">
          <a
            href={`/api/bff/invoices/${id}/pdf`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-sm border border-edge px-6 py-2.5 text-body font-medium text-fg transition-colors hover:bg-panel-raised"
          >
            Download PDF
          </a>
        </div>
      </Card>
    </SubPage>
  );
}

function unwrapDoc(data: ({ document?: TaxDocument } & TaxDocument) | null): TaxDocument | null {
  if (!data) return null;
  if (data.document && typeof data.document === "object") return data.document;
  if (data.documentNumber) return data;
  return null;
}

function TaxDocumentView({
  id,
  query,
}: {
  id: string;
  query: QueryResult<{ document?: TaxDocument } & TaxDocument>;
}) {
  const doc = unwrapDoc(query.data);

  if (query.loading) {
    return (
      <SubPage title="Document" backHref="/dashboard/profile/invoices" backLabel="Documents">
        <div className="h-[520px] animate-pulse rounded-lg bg-panel" />
      </SubPage>
    );
  }

  if (query.error || !doc || doc.docType === "settlement_statement") {
    return (
      <SubPage title="Document" backHref="/dashboard/profile/invoices" backLabel="Documents">
        <p
          role="alert"
          className="rounded-lg border border-fault bg-transparent px-6 py-10 text-center text-body text-fault"
        >
          {doc?.docType === "settlement_statement"
            ? "That document is not available."
            : (query.error ?? "This document could not be found.")}
        </p>
      </SubPage>
    );
  }

  const lines = doc.lines ?? doc.lineItems ?? [];
  const taxLines = doc.taxLines ?? [];

  return (
    <SubPage
      title={doc.documentNumber}
      subtitle={doc.docType.replace(/_/g, " ")}
      backHref="/dashboard/profile/invoices"
      backLabel="Documents"
    >
      <Card className="p-6 sm:p-8">
        <div className="grid grid-cols-1 gap-6 border-b border-hairline pb-6 sm:grid-cols-2">
          <div>
            <p className="mb-1.5 text-eyebrow font-semibold uppercase tracking-[1px] text-fg-faint">
              Issuer
            </p>
            <p className="text-body text-fg">{partyLabel(doc.issuer)}</p>
            {doc.issuer?.gstin ? (
              <p className="text-mono text-fg-faint">{doc.issuer.gstin}</p>
            ) : null}
          </div>
          <div>
            <p className="mb-1.5 text-eyebrow font-semibold uppercase tracking-[1px] text-fg-faint">
              Recipient
            </p>
            <p className="text-body text-fg">{partyLabel(doc.recipient)}</p>
            {doc.recipient?.gstin ? (
              <p className="text-mono text-fg-faint">{doc.recipient.gstin}</p>
            ) : null}
          </div>
        </div>

        <div className="py-6">
          {lines.map((item, i) => (
            <div key={i} className="flex items-baseline justify-between gap-4 py-2 text-body">
              <span className="min-w-0 text-fg-mid">
                {item.description ?? item.label ?? "Line"}
                {item.sac ? <span className="text-fg-faint"> · SAC {item.sac}</span> : null}
              </span>
              <span className="shrink-0 text-mono text-fg">
                {formatPaise(item.amountPaise ?? 0)}
              </span>
            </div>
          ))}

          {taxLines.map((tax, i) => (
            <p key={`t-${i}`} className="mt-2 text-label text-fg-faint">
              {tax.label}
              {tax.rate != null ? ` · ${formatRate(tax.rate)}` : ""}
              {tax.split
                ? tax.split.intraState
                  ? ` · CGST ${formatPaise(tax.split.cgst)} + SGST ${formatPaise(tax.split.sgst)}`
                  : ` · IGST ${formatPaise(tax.split.igst)}`
                : ""}
            </p>
          ))}

          {/* Exact, not rounded. A tax document's total is a legal figure and
              must equal the sum of its lines to the paise — rounding it here
              printed ₹297 against lines of ₹252.00 + ₹45.36, a breakdown that
              visibly does not add up. formatPaiseRounded belongs on dashboard
              summaries, never on an invoice (see lib/money.ts). */}
          <div className="mt-3 flex items-baseline justify-between border-t border-hairline pt-4">
            <span className="text-body font-semibold text-fg">Total</span>
            <span className="text-mono-lg tabular-nums text-fg">
              {formatPaise(doc.totalPaise ?? 0)}
            </span>
          </div>
        </div>

        <a
          href={`/api/bff/documents/${id}/pdf`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-sm border border-edge px-6 py-2.5 text-body font-medium text-fg transition-colors hover:bg-panel-raised"
        >
          Download PDF
        </a>
      </Card>
    </SubPage>
  );
}
