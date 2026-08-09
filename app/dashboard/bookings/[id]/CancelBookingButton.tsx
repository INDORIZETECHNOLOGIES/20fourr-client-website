"use client";

import { useState } from "react";
import { ShieldFill } from "@/components/dashboard/icons";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { CANCELLATION_SUMMARY, REFUND_DESTINATION } from "@/lib/cancellation-policy";

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
}: {
  bookingId: string;
  onCancelled: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        className="flex items-center gap-3 rounded-xl border border-red-500/35 px-4 py-3 text-[14px] font-semibold text-red-400 transition-colors hover:bg-red-500/10"
      >
        <ShieldFill size={16} />
        Cancel booking
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-500/35 bg-red-500/6 p-4">
      <p className="text-[14px] font-semibold text-red-300">Cancel this booking?</p>
      <p className="mt-1 text-[12.5px] leading-relaxed text-slate-400">
        {CANCELLATION_SUMMARY} {REFUND_DESTINATION}
      </p>

      <label htmlFor="cancel-reason" className="mt-3 block text-[12px] text-slate-500">
        Reason (optional)
      </label>
      <textarea
        id="cancel-reason"
        rows={2}
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Plans changed, booked in error…"
        className="mt-1 w-full rounded-lg border border-app-border bg-white/4 px-3 py-2 text-[13.5px] text-slate-100 outline-none placeholder:text-slate-600 focus:border-app-gold/60"
      />

      {error ? (
        <p role="alert" className="mt-2 text-[13px] text-red-300">
          {error}
        </p>
      ) : null}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="flex-1 rounded-full bg-red-500/90 px-4 py-2 text-[13.5px] font-bold text-white disabled:opacity-60"
        >
          {busy ? "Cancelling…" : "Yes, cancel"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          disabled={busy}
          className="flex-1 rounded-full border border-app-border px-4 py-2 text-[13.5px] font-semibold text-slate-300 disabled:opacity-60"
        >
          Keep it
        </button>
      </div>
    </div>
  );
}
