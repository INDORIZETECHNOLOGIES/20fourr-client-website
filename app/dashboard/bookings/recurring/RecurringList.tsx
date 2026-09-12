"use client";

import { useState } from "react";
import Link from "next/link";
import { SubPage } from "@/components/dashboard/SubPage";
import { Card } from "@/components/dashboard/primitives";
import { ListRow } from "@/components/dashboard/ListRow";
import { CalendarIcon, ClockIcon, ServiceGlyph } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { formatApiDate, formatApiTime, serviceLabel } from "@/lib/api/adapters";
import type { ApiRecurringBooking, RecurringListResponse } from "@/lib/api/types";
import { SERVICE_CATALOGUE } from "@/lib/services";

/**
 * Recurring series — list and manage.
 *
 * Reads and pauses through `/recurring` (the only route with a status PATCH),
 * but cancels through `DELETE /client/recurring-bookings/:seriesId` — the two
 * are different handlers over the same collection and only the DELETE cancels
 * the occurrences. `PATCH /recurring/:id/status` does NOT cascade: every
 * occurrence was created upfront and stays live and payable regardless of the
 * series status, which is why pausing carries the warning it does below.
 *
 * There is no skip-one-occurrence endpoint anywhere in the API. Skipping a
 * single date means cancelling that individual booking.
 *
 * Series are created from an existing booking ("Repeat this booking"), not
 * from a blank form: the provider, category and times are already settled
 * there, so the only new decisions are frequency and when to stop.
 */

const STATUS_META: Record<string, { label: string; cls: string; rail: string }> = {
  active: { label: "Active", cls: "border border-live text-live", rail: "bg-live" },
  paused: { label: "Paused", cls: "border border-attention text-attention", rail: "bg-attention" },
  cancelled: { label: "Cancelled", cls: "border border-fault text-fault", rail: "bg-fault" },
  completed: { label: "Completed", cls: "border border-hairline text-fg-mid", rail: "bg-hairline" },
};

export function RecurringList() {
  const { data, loading, error, refetch } =
    useApiQuery<RecurringListResponse>("recurring", { query: { limit: 50 } });

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);
  const [cancelReport, setCancelReport] = useState<string | null>(null);

  async function act(id: string, run: () => Promise<unknown>, successNote?: string) {
    setBusyId(id);
    setActionError(null);
    try {
      await run();
      setConfirmCancel(null);
      if (successNote) setCancelReport(successNote);
      refetch();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusyId(null);
    }
  }

  const setStatus = (id: string, status: string) =>
    act(id, () =>
      api(`recurring/${id}/status`, { method: "PATCH", body: { status } }),
    );

  const cancelSeries = (id: string) =>
    act(id, async () => {
      const result = await api<{ message?: string; bookingsCancelled?: number }>(
        `client/recurring-bookings/${id}`,
        { method: "DELETE" },
      );
      const n = result.bookingsCancelled ?? 0;
      setCancelReport(
        `Cancelled ${n} still-pending occurrence${n === 1 ? "" : "s"}. Paid and in-progress bookings in the series were not cancelled.`,
      );
    });

  const series = data?.recurringBookings ?? [];

  return (
    <SubPage
      title="Recurring Bookings"
      subtitle="Schedules that create bookings for you automatically."
      backHref="/dashboard/bookings"
      backLabel="Bookings"
    >
      {cancelReport ? (
        <p className="mb-4 rounded-lg border border-hairline px-4 py-3 text-body text-fg-mid">
          {cancelReport}
        </p>
      ) : null}

      {actionError ? (
        <p
          role="alert"
          className="mb-4 rounded-lg border border-fault bg-transparent px-4 py-3 text-body text-fault"
        >
          {actionError}
        </p>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1].map((i) => (
            <div key={i} className="h-[92px] animate-pulse rounded-lg bg-panel" />
          ))}
        </div>
      ) : error ? (
        <Card className="px-6 py-12 text-center">
          <p role="alert" className="text-body text-fault">
            {error}
          </p>
          <button
            type="button"
            onClick={refetch}
            className="mt-4 rounded-sm border border-edge px-6 py-2.5 text-body-sm font-medium text-fg"
          >
            Try again
          </button>
        </Card>
      ) : series.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <p className="text-body text-fg-mid">No recurring schedules yet.</p>
          <p className="mx-auto mt-2 max-w-[440px] text-body-sm leading-relaxed text-fg-faint">
            Open any booking and choose <strong className="text-fg-mid">Repeat this
            booking</strong> to turn it into a schedule — the provider, service and times
            carry over.
          </p>
          <Link
            href="/dashboard/bookings"
            className="mt-5 inline-block rounded-sm border border-edge px-6 py-2.5 text-body font-medium text-fg"
          >
            Go to bookings
          </Link>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {series.map((s) => (
            <SeriesRow
              key={s._id}
              series={s}
              busy={busyId === s._id}
              confirmingCancel={confirmCancel === s._id}
              onPause={() => setStatus(s._id, "paused")}
              onResume={() => setStatus(s._id, "active")}
              onAskCancel={() => setConfirmCancel(s._id)}
              onDismissCancel={() => setConfirmCancel(null)}
              onCancel={() => cancelSeries(s._id)}
            />
          ))}
        </div>
      )}
    </SubPage>
  );
}

function SeriesRow({
  series,
  busy,
  confirmingCancel,
  onPause,
  onResume,
  onAskCancel,
  onDismissCancel,
  onCancel,
}: {
  series: ApiRecurringBooking;
  busy: boolean;
  confirmingCancel: boolean;
  onPause: () => void;
  onResume: () => void;
  onAskCancel: () => void;
  onDismissCancel: () => void;
  onCancel: () => void;
}) {
  const meta = STATUS_META[series.status] ?? {
    label: series.status,
    cls: "border border-hairline text-fg-mid",
    rail: "bg-hairline",
  };
  const service = SERVICE_CATALOGUE.find((c) => c.id === series.serviceCategory);
  const provider =
    typeof series.providerId === "string" ? null : series.providerId?.name;
  const terminal = series.status === "cancelled" || series.status === "completed";
  const created = series.generatedBookings?.length ?? 0;

  return (
    <div>
      <ListRow
        railClass={meta.rail}
        muted={terminal}
        icon={<ServiceGlyph icon={service?.icon ?? "shield"} size={19} />}
        iconClass="bg-panel-raised text-fg"
        title={serviceLabel(series.serviceCategory)}
        badge={
          <span className={`rounded-full px-2.5 py-[3px] text-eyebrow font-semibold ${meta.cls}`}>
            {meta.label}
          </span>
        }
        primaryMeta={[
          { icon: <CalendarIcon size={12} />, text: describeSchedule(series) },
          {
            icon: <ClockIcon size={12} />,
            text: `${formatApiTime(series.startTime)} – ${formatApiTime(series.endTime)}`,
          },
        ]}
        secondaryMeta={[
          { text: provider ? `Provider: ${provider}` : "Provider assigned per booking" },
          { text: `${created} booking${created === 1 ? "" : "s"} created` },
        ]}
      />

      {!terminal ? (
        <div className="mt-1.5 flex flex-wrap gap-2 px-1">
          {confirmingCancel ? (
            <>
              <span className="py-2 text-body-sm text-fg-mid">
                This cancels still-pending occurrences only. Paid and in-progress bookings stay.
              </span>
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="rounded-sm bg-fault px-4 py-1.5 text-body-sm font-semibold text-ground-ink disabled:opacity-50"
              >
                {busy ? "Cancelling…" : "Yes, cancel series"}
              </button>
              <button
                type="button"
                onClick={onDismissCancel}
                className="rounded-sm border border-hairline px-4 py-1.5 text-body-sm font-semibold text-fg-mid"
              >
                Keep it
              </button>
            </>
          ) : (
            <>
              {series.status === "active" ? (
                <>
                  <SmallAction busy={busy} onClick={onPause} label="Pause" />
                  {/* PATCH /recurring/:id/status does not cascade — every
                      occurrence was created upfront and stays payable. Saying
                      so here is the difference between a paused schedule and a
                      client who thinks they stopped being charged. */}
                  <span className="py-2 text-body-sm text-fg-faint">
                    Pausing stops new occurrences only — bookings already created stay live.
                  </span>
                </>
              ) : (
                <SmallAction busy={busy} onClick={onResume} label="Resume" />
              )}
              <SmallAction busy={busy} onClick={onAskCancel} label="Cancel series" tone="danger" />
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

function SmallAction({
  label,
  busy,
  tone,
  onClick,
}: {
  label: string;
  busy: boolean;
  tone?: "danger";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={[
        "rounded-sm border px-4 py-1.5 text-body-sm font-semibold transition-colors disabled:opacity-50",
        tone === "danger"
          ? "border-fault text-fault hover:bg-panel-raised"
          : "border-hairline text-fg-mid hover:bg-panel-raised",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

/** "Every week from 12 Aug" — the series' own words, not a raw enum. */
function describeSchedule(series: ApiRecurringBooking): string {
  const type = series.recurrenceType ?? "";
  const label =
    type === "daily"
      ? "Every day"
      : type === "weekdays"
        ? "Weekdays"
        : type === "weekly"
          ? "Every week"
          : type === "custom"
            ? "Custom days"
            : "Repeats";
  const from = series.seriesStartDate ? ` from ${formatApiDate(series.seriesStartDate)}` : "";
  const to = series.seriesEndDate ? ` until ${formatApiDate(series.seriesEndDate)}` : "";
  return `${label}${from}${to}`;
}
