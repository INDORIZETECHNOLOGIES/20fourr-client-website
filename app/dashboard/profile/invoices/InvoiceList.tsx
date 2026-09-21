"use client";

import Link from "next/link";
import { Card } from "@/components/dashboard/primitives";
import { ListRow } from "@/components/dashboard/ListRow";
import { CalendarIcon, InvoiceIcon } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { formatApiDate, serviceLabel } from "@/lib/api/adapters";
import type { InvoiceListResponse, TaxDocument, TaxDocumentListResponse } from "@/lib/api/types";
import { formatPaiseRounded } from "@/lib/money";

const STATUS: Record<string, { label: string; cls: string }> = {
  issued: { label: "Issued", cls: "border border-live text-live" },
  draft: { label: "Draft", cls: "border border-attention text-attention" },
  cancelled: { label: "Cancelled", cls: "border border-hairline text-fg-mid" },
};

const DOC_LABEL: Record<string, string> = {
  platform_fee_invoice: "Platform fee invoice",
  service_tax_invoice: "Service tax invoice",
  bill_of_supply: "Bill of supply",
  platform_credit_note: "Platform credit note",
  service_credit_note: "Service credit note",
};

function isSettlement(doc: TaxDocument) {
  return doc.docType === "settlement_statement";
}

export function InvoiceList() {
  const invoicesQ = useApiQuery<InvoiceListResponse>("invoices", { query: { limit: 50 } });
  const docsQ = useApiQuery<TaxDocumentListResponse>("documents", { query: { limit: 50 } });

  const loading = invoicesQ.loading || docsQ.loading;
  if (loading) {
    return (
      <Card className="overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-b border-hairline px-5 py-4 last:border-b-0">
            <div className="h-[44px] animate-pulse rounded-lg bg-panel-raised" />
          </div>
        ))}
      </Card>
    );
  }

  if (invoicesQ.error && docsQ.error) {
    return (
      <Card className="px-6 py-12 text-center">
        <p role="alert" className="text-body text-fault">
          {invoicesQ.error}
        </p>
        <button
          type="button"
          onClick={() => {
            invoicesQ.refetch();
            docsQ.refetch();
          }}
          className="mt-4 rounded-sm border border-edge px-6 py-2.5 text-body-sm font-medium text-fg"
        >
          Try again
        </button>
      </Card>
    );
  }

  const invoices = invoicesQ.data?.invoices ?? [];
  const documents = (docsQ.data?.documents ?? []).filter((d) => !isSettlement(d));

  if (invoices.length === 0 && documents.length === 0) {
    return (
      <Card className="px-6 py-12 text-center">
        <p className="text-body text-fg-faint">
          No documents yet. 20fourr&apos;s platform fee invoice is issued at payment. The
          provider&apos;s own invoice appears on the booking once the work is complete.
        </p>
      </Card>
    );
  }

  type Row = {
    key: string;
    href: string;
    title: string;
    status: string;
    date?: string;
    amount: number;
    meta: string;
  };

  const rows: Row[] = [
    ...documents.map((d) => ({
      key: `d-${d._id}`,
      href: `/dashboard/profile/invoices/${d._id}?source=document`,
      title: d.documentNumber,
      status: d.status ?? "issued",
      date: d.issuedAt,
      amount: d.totalPaise ?? 0,
      meta: DOC_LABEL[d.docType] ?? d.docType,
    })),
    ...invoices.map((inv) => ({
      key: `i-${inv._id}`,
      href: `/dashboard/profile/invoices/${inv._id}`,
      title: inv.invoiceNumber,
      status: inv.status,
      date: inv.issuedAt,
      amount: inv.totalAmount ?? 0,
      meta: serviceLabel(inv.serviceCategory),
    })),
  ].sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));

  return (
    <div className="flex flex-col gap-2.5">
      {rows.map((row) => {
        const status = STATUS[row.status] ?? {
          label: row.status,
          cls: "border border-hairline text-fg-mid",
        };
        return (
          <ListRow
            key={row.key}
            href={row.href}
            railClass={row.status === "issued" ? "bg-live" : "bg-hairline"}
            icon={<InvoiceIcon size={18} />}
            iconClass="bg-panel-raised text-fg"
            title={row.title}
            badge={
              <span className={`rounded-full px-2.5 py-[3px] text-eyebrow font-semibold ${status.cls}`}>
                {status.label}
              </span>
            }
            primaryMeta={[{ icon: <CalendarIcon size={12} />, text: formatApiDate(row.date) }]}
            secondaryMeta={[{ text: row.meta }]}
            amount={formatPaiseRounded(row.amount)}
          />
        );
      })}
    </div>
  );
}
