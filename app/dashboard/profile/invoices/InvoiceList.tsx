"use client";

import { useMemo, useState } from "react";
import { Card } from "@/components/dashboard/primitives";
import { ListRow } from "@/components/dashboard/ListRow";
import { CalendarIcon, InvoiceIcon } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { formatApiDate } from "@/lib/api/adapters";
import type { BillingDocumentsResponse, BillingDocumentSource } from "@/lib/api/types";
import {
  EMPTY_FILTERS,
  SOURCE_LABELS,
  documentHref,
  documentStatus,
  documentTypeLabel,
  exportPath,
  filterError,
  filtersToQuery,
  financialYears,
  type DocumentFilters,
} from "@/lib/billing-documents";
import { formatPaiseRounded } from "@/lib/money";

const PAGE_SIZE = 25;

const TONE: Record<"live" | "muted" | "attention", string> = {
  live: "border border-live text-live",
  muted: "border border-hairline text-fg-mid",
  attention: "border border-attention text-attention",
};

/**
 * Every billing document the client holds, from one call (backend spec 0016). The server merges
 * old invoices, v6 tax documents and providers' uploaded invoices; nothing is merged here.
 */
export function InvoiceList() {
  const [filters, setFilters] = useState<DocumentFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(1);
  const [exporting, setExporting] = useState<"csv" | "zip" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const years = useMemo(() => financialYears(new Date()), []);
  const invalid = filterError(filters);
  const q = useApiQuery<BillingDocumentsResponse>(invalid ? null : "client/billing-documents", {
    query: { ...filtersToQuery(filters), page: String(page), limit: String(PAGE_SIZE) },
  });

  const set = (patch: Partial<DocumentFilters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
    setExportError(null);
  };

  async function download(kind: "csv" | "zip") {
    setExporting(kind);
    setExportError(null);
    try {
      const res = await fetch(exportPath(kind, filters), { credentials: "same-origin" });
      if (!res.ok) {
        const body = await res.json().catch(() => null);
        setExportError(
          body?.code === "SC_1571"
            ? "Too many documents for one ZIP. Narrow the period, for example to one financial year or a few months, and try again."
            : (body?.message ?? "Couldn't prepare the download. Try again."),
        );
        return;
      }
      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") ?? "";
      const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? `20fourr-documents.${kind}`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = name;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Couldn't prepare the download. Check your connection and try again.");
    } finally {
      setExporting(null);
    }
  }

  const docs = q.data?.documents ?? [];
  const pagination = q.data?.pagination;
  const filtered = Object.values(filtersToQuery(filters)).length > 0;

  return (
    <div className="flex flex-col gap-4">
      <Card className="p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Filter id="doc-fy" label="Financial year">
            <select
              id="doc-fy"
              value={filters.financialYear}
              onChange={(e) => set({ financialYear: e.target.value })}
              className={controlCls}
            >
              <option value="">Any year</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  FY {y}
                </option>
              ))}
            </select>
          </Filter>
          <Filter id="doc-from" label="From">
            <input id="doc-from" type="date" value={filters.from} onChange={(e) => set({ from: e.target.value })} className={controlCls} />
          </Filter>
          <Filter id="doc-to" label="To">
            <input id="doc-to" type="date" value={filters.to} onChange={(e) => set({ to: e.target.value })} className={controlCls} />
          </Filter>
          <Filter id="doc-type" label="Type">
            <select
              id="doc-type"
              value={filters.source}
              onChange={(e) => set({ source: e.target.value as BillingDocumentSource | "" })}
              className={controlCls}
            >
              <option value="">All documents</option>
              {(Object.keys(SOURCE_LABELS) as BillingDocumentSource[]).map((s) => (
                <option key={s} value={s}>
                  {SOURCE_LABELS[s]}
                </option>
              ))}
            </select>
          </Filter>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
          <button
            type="button"
            disabled={exporting !== null || Boolean(invalid) || docs.length === 0}
            onClick={() => download("csv")}
            className="rounded-sm border border-edge px-4 py-2 text-body-sm font-medium text-fg transition-colors hover:border-fg-mid disabled:opacity-40"
          >
            {exporting === "csv" ? "Preparing CSV…" : "Download CSV"}
          </button>
          <button
            type="button"
            disabled={exporting !== null || Boolean(invalid) || docs.length === 0}
            onClick={() => download("zip")}
            className="rounded-sm border border-edge px-4 py-2 text-body-sm font-medium text-fg transition-colors hover:border-fg-mid disabled:opacity-40"
          >
            {exporting === "zip" ? "Preparing ZIP…" : "Download PDFs (ZIP)"}
          </button>
          <p className="text-label text-fg-faint">Both use the filters above. The CSV is a GST register with a net total.</p>
          {filtered ? (
            <button type="button" onClick={() => set(EMPTY_FILTERS)} className="ml-auto text-body-sm text-fg-mid underline underline-offset-2 hover:text-fg">
              Clear filters
            </button>
          ) : null}
        </div>
        {invalid || exportError ? (
          <p role="alert" className="mt-3 text-body-sm text-fault">
            {invalid ?? exportError}
          </p>
        ) : null}
      </Card>

      {q.loading ? (
        <Card className="overflow-hidden">
          {[0, 1, 2].map((i) => (
            <div key={i} className="border-b border-hairline px-5 py-4 last:border-b-0">
              <div className="h-[44px] animate-pulse rounded-lg bg-panel-raised" />
            </div>
          ))}
        </Card>
      ) : q.error ? (
        <Card className="px-6 py-12 text-center">
          <p role="alert" className="text-body text-fault">
            {q.errorCode === "SC_1570" ? "Those dates don't fit that financial year. Adjust the filters." : q.error}
          </p>
          <button
            type="button"
            onClick={() => q.refetch()}
            className="mt-4 rounded-sm border border-edge px-6 py-2.5 text-body-sm font-medium text-fg"
          >
            Try again
          </button>
        </Card>
      ) : docs.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <p className="text-body text-fg-faint">
            {filtered
              ? "No documents match these filters."
              : "No documents yet. 20fourr's platform fee invoice is issued when you pay; the service document follows when the shift ends."}
          </p>
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-2.5">
            {docs.map((d) => {
              const status = documentStatus(d);
              const href = documentHref(d);
              const meta = [documentTypeLabel(d), d.bookingRef ? `Booking ${d.bookingRef}` : null, d.reversesNumber ? `Reverses ${d.reversesNumber}` : null]
                .filter(Boolean)
                .join(" · ");
              return (
                <ListRow
                  key={d.id}
                  href={href ?? undefined}
                  railClass={status.tone === "live" ? "bg-live" : status.tone === "attention" ? "bg-attention" : "bg-hairline"}
                  icon={<InvoiceIcon size={18} />}
                  iconClass="bg-panel-raised text-fg"
                  title={d.number}
                  badge={
                    <span className={`rounded-full px-2.5 py-[3px] text-eyebrow font-semibold ${TONE[status.tone]}`}>
                      {status.label}
                    </span>
                  }
                  primaryMeta={[{ icon: <CalendarIcon size={12} />, text: formatApiDate(d.issuedAt) }]}
                  secondaryMeta={[{ text: meta }]}
                  amount={`${d.isCreditNote ? "− " : ""}${formatPaiseRounded(d.totalPaise)}`}
                />
              );
            })}
          </div>
          {pagination && pagination.pages > 1 ? (
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-sm border border-hairline px-4 py-2 text-body-sm text-fg-mid hover:border-edge disabled:opacity-40"
              >
                Newer
              </button>
              <p className="text-label text-fg-faint">
                Page {pagination.page} of {pagination.pages} · {pagination.total} documents
              </p>
              <button
                type="button"
                disabled={page >= pagination.pages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-sm border border-hairline px-4 py-2 text-body-sm text-fg-mid hover:border-edge disabled:opacity-40"
              >
                Older
              </button>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}

const controlCls =
  "w-full rounded-lg border border-hairline bg-panel-raised px-3 py-2.5 text-body-sm text-fg outline-none transition-colors focus:border-edge [color-scheme:dark]";

function Filter({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-label font-medium text-fg-mid">
        {label}
      </label>
      {children}
    </div>
  );
}
