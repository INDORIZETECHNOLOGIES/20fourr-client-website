import type { BillingDocument, BillingDocumentSource } from "@/lib/api/types";

/**
 * Document history helpers (spec 0003 C, backend 0016). Pure: no fetching, no formatting of money.
 */

export type DocumentFilters = {
  financialYear: string; // "2026-27", or "" for any
  from: string; // YYYY-MM-DD or ""
  to: string;
  source: BillingDocumentSource | "";
};

export const EMPTY_FILTERS: DocumentFilters = { financialYear: "", from: "", to: "", source: "" };

/** Indian financial years (April–March), newest first, starting with the one `now` is in. */
export function financialYears(now: Date, count = 4): string[] {
  const y = now.getFullYear();
  const start = now.getMonth() >= 3 ? y : y - 1; // April is month 3
  return Array.from({ length: count }, (_, i) => {
    const s = start - i;
    return `${s}-${String((s + 1) % 100).padStart(2, "0")}`;
  });
}

/** The query both the list and the exports take, with empty filters left out. */
export function filtersToQuery(f: DocumentFilters): Record<string, string> {
  const q: Record<string, string> = {};
  if (f.financialYear) q.financialYear = f.financialYear;
  if (f.from) q.from = f.from;
  if (f.to) q.to = f.to;
  if (f.source) q.source = f.source;
  return q;
}

/** A filter the server would refuse (SC_1570), caught before asking. */
export function filterError(f: DocumentFilters): string | null {
  if (f.from && f.to && f.from > f.to) return "The start date is after the end date.";
  return null;
}

export const SOURCE_LABELS: Record<BillingDocumentSource, string> = {
  v6_document: "Tax documents",
  v1_invoice: "Earlier invoices",
  provider_upload: "Providers' own invoices",
};

const TYPE_LABELS: Record<string, string> = {
  invoice: "Invoice",
  provider_invoice: "Provider's invoice",
  platform_fee_invoice: "Platform fee invoice",
  service_tax_invoice: "Service tax invoice",
  bill_of_supply: "Bill of supply",
  platform_credit_note: "Platform fee credit note",
  service_credit_note: "Service credit note",
};

export function documentTypeLabel(doc: Pick<BillingDocument, "documentType">): string {
  return TYPE_LABELS[doc.documentType] ?? doc.documentType.replace(/_/g, " ");
}

/**
 * Where a row opens. v1 invoices and v6 documents have their own detail pages; a provider's
 * uploaded invoice lives on its booking.
 */
export function documentHref(doc: Pick<BillingDocument, "id" | "source" | "bookingId">): string | null {
  if (doc.source === "v6_document") return `/dashboard/profile/invoices/${doc.id}?source=document`;
  if (doc.source === "v1_invoice") return `/dashboard/profile/invoices/${doc.id}`;
  return doc.bookingId ? `/dashboard/bookings/${doc.bookingId}` : null;
}

/** How a row's standing reads. A reversed v6 document is still valid; a cancelled v1 one is void. */
export function documentStatus(doc: Pick<BillingDocument, "status" | "reversedByCreditNote" | "isCreditNote">): {
  label: string;
  tone: "live" | "muted" | "attention";
} {
  if (doc.isCreditNote) return { label: "Credit note", tone: "attention" };
  if (doc.reversedByCreditNote) return { label: "Reversed", tone: "muted" };
  if (doc.status === "cancelled") return { label: "Void", tone: "muted" };
  return { label: "Issued", tone: "live" };
}

/** Same filters as the list; the BFF streams the file through. */
export function exportPath(kind: "csv" | "zip", f: DocumentFilters): string {
  const q = new URLSearchParams(filtersToQuery(f)).toString();
  return `/api/bff/client/billing-documents/export.${kind}${q ? `?${q}` : ""}`;
}
