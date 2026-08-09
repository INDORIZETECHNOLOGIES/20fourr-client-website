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
 * Uses `/recurring`, the implementation the client app calls. The parallel
 * `/client/recurring-bookings` route exists but has no pause, resume or
 * skip-next, so it cannot back this screen.
 *
 * Series are created from an existing booking ("Repeat this booking"), not
 * from a blank form: the provider, category and times are already settled
 * there, so the only new decisions are frequency and when to stop.
 */

const STATUS_META: Record<string, { label: string; cls: string; accent: string }> = {
  active: { label: "Active", cls: "bg-green-500/14 text-green-500", accent: "#22c55e" },
  paused: { label: "Paused", cls: "bg-app-warning/14 text-app-warning", accent: "#f59e0b" },
  cancelled: { label: "Cancelled", cls: "bg-red-500/14 text-red-400", accent: "#ef4444" },
  completed: { label: "Completed", cls: "bg-slate-500/14 text-slate-400", accent: "#94a3b8" },
};

export function RecurringList() {
  const { data, loading, error, refetch } =
    useApiQuery<RecurringListResponse>("recurring", { query: { limit: 50 } });

  const [busyId, setBusyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState<string | null>(null);

  async function act(id: string, run: () => Promise<unknown>) {
    setBusyId(id);
    setActionError(null);
    try {
      await run();
      setConfirmCancel(null);
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

  const skipNext = (id: string) =>
    act(id, () => api(`recurring/${id}/skip-next`, { method: "POST" }));

  const series = data?.recurringBookings ?? [];

  return (
    <SubPage
      title="Recurring Bookings"
      subtitle="Schedules that create bookings for you automatically."
      backHref="/dashboard/bookings"
      backLabel="Bookings"
    >
      {actionError ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[14px] text-red-300"
        >
          {actionError}
        </p>
      ) : null}

      {loading ? (
        <div className="flex flex-col gap-2.5">
          {[0, 1].map((i) => (
            <div key={i} className="h-[92px] animate-pulse rounded-2xl bg-app-card" />
          ))}
        </div>
      ) : error ? (
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
      ) : series.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <p className="text-[15px] text-slate-300">No recurring schedules yet.</p>
          <p className="mx-auto mt-2 max-w-[440px] text-[13.5px] leading-relaxed text-slate-500">
            Open any booking and choose <strong className="text-slate-300">Repeat this
            booking</strong> to turn it into a schedule — the provider, service and times
            carry over.
          </p>
          <Link
            href="/dashboard/bookings"
            className="mt-5 inline-block rounded-full border border-app-gold px-6 py-2.5 text-[14px] font-bold text-app-gold"
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
              onSkip={() => skipNext(s._id)}
              onAskCancel={() => setConfirmCancel(s._id)}
              onDismissCancel={() => setConfirmCancel(null)}
              onCancel={() => setStatus(s._id, "cancelled")}
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
  onSkip,
  onAskCancel,
  onDismissCancel,
  onCancel,
}: {
  series: ApiRecurringBooking;
  busy: boolean;
  confirmingCancel: boolean;
  onPause: () => void;
  onResume: () => void;
  onSkip: () => void;
  onAskCancel: () => void;
  onDismissCancel: () => void;
  onCancel: () => void;
}) {
  const meta = STATUS_META[series.status] ?? {
    label: series.status,
    cls: "bg-slate-500/14 text-slate-400",
    accent: "#94a3b8",
  };
  const service = SERVICE_CATALOGUE.find((c) => c.id === series.serviceCategory);
  const provider =
    typeof series.providerId === "string" ? null : series.providerId?.name;
  const terminal = series.status === "cancelled" || series.status === "completed";
  const created = series.generatedBookings?.length ?? 0;

  return (
    <div>
      <ListRow
        accent={meta.accent}
        muted={terminal}
        icon={<ServiceGlyph icon={service?.icon ?? "shield"} size={19} />}
        iconClass={
          service ? `${service.iconBg} ${service.color}` : "bg-app-gold/12 text-app-gold"
        }
        title={serviceLabel(series.serviceCategory)}
        badge={
          <span className={`rounded-full px-2.5 py-[3px] text-[11px] font-bold ${meta.cls}`}>
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
              <span className="py-2 text-[13px] text-slate-400">
                Cancel the whole series? Bookings already created stay.
              </span>
              <button
                type="button"
                onClick={onCancel}
                disabled={busy}
                className="rounded-full bg-red-500/90 px-4 py-1.5 text-[12.5px] font-bold text-white disabled:opacity-50"
              >
                {busy ? "Cancelling…" : "Yes, cancel series"}
              </button>
              <button
                type="button"
                onClick={onDismissCancel}
                className="rounded-full border border-app-border px-4 py-1.5 text-[12.5px] font-semibold text-slate-300"
              >
                Keep it
              </button>
            </>
          ) : (
            <>
              {series.status === "active" ? (
                <>
                  <SmallAction busy={busy} onClick={onSkip} label="Skip next" />
                  <SmallAction busy={busy} onClick={onPause} label="Pause" />
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
        "rounded-full border px-4 py-1.5 text-[12.5px] font-semibold transition-colors disabled:opacity-50",
        tone === "danger"
          ? "border-red-500/30 text-red-400 hover:bg-red-500/10"
          : "border-app-border text-slate-300 hover:bg-white/5",
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
