"use client";

import Link from "next/link";
import { Card } from "@/components/dashboard/primitives";
import { ListRow } from "@/components/dashboard/ListRow";
import { CalendarIcon, InvoiceIcon } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { formatApiDate, serviceLabel } from "@/lib/api/adapters";
import type { InvoiceListResponse } from "@/lib/api/types";
import { formatPaiseRounded } from "@/lib/money";

/**
 * The API's invoice statuses are draft / issued / cancelled — a document
 * lifecycle, not a payment one. The earlier paid/due/refunded labels described
 * something the invoice record does not track.
 */
const STATUS: Record<string, { label: string; cls: string }> = {
  issued: { label: "Issued", cls: "bg-green-500/14 text-green-500" },
  draft: { label: "Draft", cls: "bg-app-warning/14 text-app-warning" },
  cancelled: { label: "Cancelled", cls: "bg-slate-500/14 text-slate-400" },
};

export function InvoiceList() {
  const { data, loading, error, refetch } = useApiQuery<InvoiceListResponse>("invoices", {
    query: { limit: 50 },
  });

  if (loading) {
    return (
      <Card className="overflow-hidden">
        {[0, 1, 2].map((i) => (
          <div key={i} className="border-b border-white/6 px-5 py-4 last:border-b-0">
            <div className="h-[44px] animate-pulse rounded-lg bg-white/4" />
          </div>
        ))}
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="px-6 py-12 text-center">
        <p role="alert" className="text-[14px] text-red-300">
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
    );
  }

  const invoices = data?.invoices ?? [];

  if (invoices.length === 0) {
    return (
      <Card className="px-6 py-12 text-center">
        <p className="text-[14px] text-slate-500">
          No invoices yet. One is issued for every completed booking.
        </p>
      </Card>
    );
  }

  const RAIL: Record<string, string> = {
    issued: "#22c55e",
    draft: "#f59e0b",
    cancelled: "#94a3b8",
  };

  const hasLive = invoices.some((i) => i.status !== "cancelled");

  return (
    <div className="flex flex-col gap-2.5">
      {invoices.map((inv) => {
        const status = STATUS[inv.status] ?? {
          label: inv.status,
          cls: "bg-slate-500/14 text-slate-400",
        };
        return (
          <ListRow
            key={inv._id}
            href={`/dashboard/profile/invoices/${inv._id}`}
            accent={RAIL[inv.status] ?? "#94a3b8"}
            muted={hasLive && inv.status === "cancelled"}
            icon={<InvoiceIcon size={18} />}
            iconClass="bg-app-gold/12 text-app-gold"
            title={inv.invoiceNumber}
            badge={
              <span className={`rounded-full px-2.5 py-[3px] text-[11px] font-bold ${status.cls}`}>
                {status.label}
              </span>
            }
            primaryMeta={[
              { icon: <CalendarIcon size={12} />, text: formatApiDate(inv.issuedAt) },
            ]}
            secondaryMeta={[{ text: serviceLabel(inv.serviceCategory) }]}
            amount={formatPaiseRounded(inv.totalAmount ?? 0)}
            reference={inv.bookingRef}
          />
        );
      })}
    </div>
  );
}
