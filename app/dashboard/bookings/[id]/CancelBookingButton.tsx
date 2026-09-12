"use client";

import { useState } from "react";
import { ShieldFill } from "@/components/dashboard/icons";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import {
  CANCELLATION_SUMMARY,
  refundForCancellation,
  refundDestination,
} from "@/lib/cancellation-policy";
import { formatPaiseRounded } from "@/lib/money";

/**
 * Cancel, wired to `POST /bookings/:id/cancel`.
 *
 * This was a decorative button — it rendered in danger red, looked live, and
 * did nothing when clicked. A cancel control that silently no-ops is worse than
 * no control: the client believes the guard is stood down and it isn't.
 *
 * It asks for a reason because the API records one, and it confirms first
 * because cancelling after the provider accepts can incur a charge.
 */
export function CancelBookingButton({
  bookingId,
  onCancelled,
  totalPaise,
  dutyStartsAt,
  paid,
  engine = "v1",
}: {
  bookingId: string;
  onCancelled: () => void;
  /** Booking total in paise, for the live refund estimate. */
  totalPaise?: number;
  /** Duty start, which is what the refund tiers are measured against. */
  dutyStartsAt?: Date | null;
  /** Before payment nothing was taken, so there is nothing to refund. */
  paid?: boolean;
  engine?: "v1" | "v6";
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const estimate = refundForCancellation(totalPaise ?? 0, dutyStartsAt ?? null);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api(`bookings/${bookingId}/cancel`, {
        method: "POST",
        body: { reason: reason.trim() || "Cancelled by the client." },
      });
      setOpen(false);
      onCancelled();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex items-center gap-3 rounded-lg border border-fault px-4 py-3 text-body font-semibold text-fault transition-colors hover:bg-panel-raised"
      >
        <ShieldFill size={16} />
        Cancel booking
      </button>
    );
  }

  return (
    <div className="rounded-lg border border-fault bg-fault/6 p-4">
      <p className="text-body font-semibold text-fault">Cancel this booking?</p>
      {paid && totalPaise ? (
        <div className="mt-2 rounded-lg border border-hairline bg-panel-raised px-3 py-2.5">
          <p className="text-body-sm text-fg-mid">
            Cancelling now refunds{" "}
            <strong className="text-fg">
              {formatPaiseRounded(estimate.refundPaise)}
            </strong>{" "}
            ({estimate.percent}% of {formatPaiseRounded(totalPaise)}).
          </p>
          {estimate.hoursRemaining !== null ? (
            <p className="mt-0.5 text-label text-fg-faint">
              {Math.floor(estimate.hoursRemaining)}h until duty starts · figure confirmed
              by the server on cancel.
            </p>
          ) : null}
        </div>
      ) : null}

      <p className="mt-2 text-body-sm leading-relaxed text-fg-mid">
        {paid
          ? `${CANCELLATION_SUMMARY} ${refundDestination(engine)}`
          : "Nothing has been charged for this booking, so there is nothing to refund."}
      </p>

      <label htmlFor="cancel-reason" className="mt-3 block text-label text-fg-faint">
        Reason (optional)
      </label>
      <textarea
        id="cancel-reason"
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Plans changed, booked in error…"
        className="mt-1 w-full rounded-lg border border-hairline bg-panel-raised px-3 py-2 text-body-sm text-fg outline-none placeholder:text-fg-faint focus:border-edge"
      />

      {error ? (
        <p role="alert" className="mt-2 text-body-sm text-fault">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="flex-1 rounded-sm bg-fault px-4 py-2 text-body-sm font-semibold text-ground-ink disabled:opacity-60"
        >
          {busy ? "Cancelling…" : "Yes, cancel"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className="flex-1 rounded-sm border border-hairline px-4 py-2 text-body-sm font-semibold text-fg-mid disabled:opacity-60"
        >
          Keep it
        </button>
      </div>
    </div>
  );
}
