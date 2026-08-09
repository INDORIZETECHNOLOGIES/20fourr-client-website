"use client";

import { Card } from "@/components/dashboard/primitives";
import { AlertCircleIcon, CheckCircleFill } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { formatApiDate, serviceLabel } from "@/lib/api/adapters";
import type { ApiClientProfile, BookingListResponse } from "@/lib/api/types";
import { NOTHING_CHARGED_YET, REFUND_DESTINATION, REFUND_TIERS } from "@/lib/cancellation-policy";
import { formatPaise, formatPaiseRounded } from "@/lib/money";

/**
 * Account standing — NOT a penalties ledger.
 *
 * This screen used to list "penalties" levied against the client, with an
 * appeal button. None of that exists: the Penalty model has a `providerId` and
 * no client field at all, the routes are `/provider/penalties` and
 * `/provider/penalties/:id/appeal`, and there is no client-facing penalty or
 * appeal endpoint anywhere in the API. It was inventing a punitive record the
 * server does not keep.
 *
 * What a client *does* have is: a blacklist flag on their profile, and a
 * cancellation history where a late cancellation is settled through a partial
 * refund. Both are real, so both are what this shows.
 */
export function ComplianceClient() {
  const { data: profileData, loading: profileLoading } =
    useApiQuery<{ profile: ApiClientProfile }>("client/profile");
  const { data: bookingData, loading: bookingsLoading } =
    useApiQuery<BookingListResponse>("client/bookings", { query: { limit: 100 } });

  const profile = profileData?.profile;
  const blacklisted = Boolean(profile?.isBlacklisted);

  // A cancellation the client initiated, with whatever was refunded.
  const cancellations = (bookingData?.bookings ?? [])
    .filter((b) => b.cancellation?.cancelledAt)
    .sort(
      (a, b) =>
        new Date(b.cancellation?.cancelledAt ?? 0).getTime() -
        new Date(a.cancellation?.cancelledAt ?? 0).getTime(),
    );

  const byClient = cancellations.filter((b) => b.cancellation?.cancelledBy === "client");

  /**
   * What a cancellation cost: the booking total minus whatever came back. Only
   * meaningful once the booking was actually paid for — an unpaid `pending`
   * booking has a total but nothing was ever taken, so a "charge" there would
   * be fiction.
   */
  const chargedTotal = byClient.reduce((sum, b) => {
    const paid = ["payment_done", "duty_started", "duty_ended", "completed"].includes(
      b.status,
    );
    if (!paid) return sum;
    const refunded = b.cancellation?.refundAmount ?? 0;
    return sum + Math.max(0, (b.totalAmount ?? 0) - refunded);
  }, 0);

  const loading = profileLoading || bookingsLoading;

  return (
    <>
      {/* Standing */}
      <Card
        className={[
          "flex flex-wrap items-center gap-4 p-6",
          blacklisted ? "border-red-500/40" : "",
        ].join(" ")}
      >
        <span
          className={[
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl",
            blacklisted ? "bg-red-500/14 text-red-400" : "bg-green-500/12 text-green-500",
          ].join(" ")}
        >
          {blacklisted ? <AlertCircleIcon size={22} /> : <CheckCircleFill size={22} />}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-display text-[18px] font-extrabold text-slate-100">
            {loading
              ? "Checking…"
              : blacklisted
                ? "Account restricted"
                : "Account in good standing"}
          </p>
          <p className="mt-1 text-[13.5px] leading-relaxed text-slate-500">
            {blacklisted
              ? "New bookings are blocked. Contact support to resolve this."
              : "You can book normally. Nothing is outstanding on your account."}
          </p>
        </div>
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Stat label="Cancellations by you" value={loading ? null : String(byClient.length)} />
        <Stat
          label="Not refunded"
          value={loading ? null : formatPaiseRounded(chargedTotal)}
          tone={chargedTotal > 0 ? "warning" : "good"}
        />
      </div>

      <h3 className="mb-3 mt-8 text-[12px] font-semibold uppercase tracking-[1.2px] text-slate-500">
        Cancellation History
      </h3>

      {loading ? (
        <div className="h-[120px] animate-pulse rounded-2xl bg-app-card" />
      ) : cancellations.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <p className="text-[14px] text-slate-500">
            No cancellations on your account.
          </p>
        </Card>
      ) : (
        <div className="flex flex-col gap-2.5">
          {cancellations.map((b) => {
            const c = b.cancellation!;
            const mine = c.cancelledBy === "client";
            const refunded = c.refundAmount ?? 0;
            return (
              <Card key={b._id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-[14.5px] font-semibold text-slate-100">
                      {serviceLabel(b.serviceCategory)}
                    </p>
                    <span
                      className={[
                        "rounded-full px-2.5 py-[3px] text-[11px] font-bold",
                        mine
                          ? "bg-app-warning/14 text-app-warning"
                          : "bg-slate-500/14 text-slate-400",
                      ].join(" ")}
                    >
                      {mine ? "Cancelled by you" : `Cancelled by ${c.cancelledBy ?? "—"}`}
                    </span>
                  </div>
                  <p className="mt-1 text-[12.5px] text-slate-500">
                    {b.bookingId} · {formatApiDate(c.cancelledAt)}
                  </p>
                  {c.cancellationReason ? (
                    <p className="mt-1 text-[12.5px] italic text-slate-600">
                      “{c.cancellationReason}”
                    </p>
                  ) : null}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-[14.5px] font-bold text-slate-100">
                    {formatPaise(b.totalAmount ?? 0)}
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-600">
                    {refunded > 0
                      ? `${formatPaise(refunded)} refunded${
                          c.refundStatus ? ` · ${c.refundStatus}` : ""
                        }`
                      : "Nothing was charged"}
                  </p>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <h3 className="mb-3 mt-8 text-[12px] font-semibold uppercase tracking-[1.2px] text-slate-500">
        How Cancellation Refunds Work
      </h3>
      <Card className="p-6">
        <p className="text-[13.5px] leading-relaxed text-slate-400">
          {NOTHING_CHARGED_YET}
        </p>

        {/* The tiers come from lib/cancellation-policy.ts, which mirrors the
            server's own settings — not hand-written per screen. */}
        <div className="mt-5 flex flex-col gap-2.5">
          {REFUND_TIERS.map((tier) => (
            <div
              key={tier.label}
              className="flex items-center gap-4 rounded-xl border border-white/6 bg-white/3 px-4 py-3"
            >
              <span
                className={[
                  "flex h-12 w-14 shrink-0 items-center justify-center rounded-lg font-display text-[17px] font-extrabold",
                  tier.percent >= 90
                    ? "bg-green-500/12 text-green-500"
                    : tier.percent > 0
                      ? "bg-app-warning/12 text-app-warning"
                      : "bg-red-500/12 text-red-400",
                ].join(" ")}
              >
                {tier.percent}%
              </span>
              <div className="min-w-0">
                <p className="text-[14px] font-semibold text-slate-200">{tier.label}</p>
                <p className="mt-0.5 text-[12.5px] leading-relaxed text-slate-500">
                  {tier.detail}
                </p>
              </div>
            </div>
          ))}
        </div>

        <ul className="mt-5 flex flex-col gap-3 text-[13.5px] leading-relaxed text-slate-400">
          <li>
            <strong className="text-slate-200">Where the money goes.</strong>{" "}
            {REFUND_DESTINATION}
          </li>
          <li>
            <strong className="text-slate-200">Timing is from the duty start,</strong> not
            from when the provider accepted.
          </li>
          <li>
            <strong className="text-slate-200">If the provider cancels,</strong> you are
            refunded in full and the penalty falls on them, not you.
          </li>
          <li>
            <strong className="text-slate-200">Repeated late cancellations</strong> can
            lead to a restriction on the account. If you think a refund is wrong, raise a
            support ticket — that is the route for disputing it.
          </li>
        </ul>
      </Card>
    </>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: string | null;
  tone?: "neutral" | "good" | "warning";
}) {
  return (
    <Card className="p-5">
      <p className="text-[12.5px] font-medium text-slate-500">{label}</p>
      <p
        className={[
          "mt-2 font-display text-[28px] font-extrabold leading-none",
          tone === "warning"
            ? "text-app-warning"
            : tone === "good"
              ? "text-green-500"
              : "text-slate-100",
        ].join(" ")}
      >
        {value === null ? (
          <span className="inline-block h-[28px] w-20 animate-pulse rounded bg-white/8" />
        ) : (
          value
        )}
      </p>
    </Card>
  );
}
