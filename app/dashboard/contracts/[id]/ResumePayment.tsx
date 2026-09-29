"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { ApiContract, DuePayment } from "@/lib/api/types";
import { formatDay } from "@/lib/contracts";
import { formatPaiseRounded } from "@/lib/money";
import { PayNowButton } from "@/app/dashboard/bookings/[id]/PayNowButton";

/**
 * Paying a suspended contract (0014 rule 7). The server re-prices the unpaid month from tomorrow,
 * replacing its booking, so the amount is only known after POST /contracts/:id/pay. It's shown
 * before the checkout opens, never assumed from the old figure.
 */
export function ResumePayment({ contract, onPaid }: { contract: ApiContract; onPaid: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [due, setDue] = useState<DuePayment | null>(null);

  async function prepare() {
    setBusy(true);
    setError(null);
    try {
      setDue(await api<DuePayment>(`contracts/${contract._id}/pay`, { method: "POST" }));
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  if (due) {
    return (
      <div className="flex flex-col gap-2">
        <p className="text-label leading-relaxed text-fg-faint">
          {due.resumesOn
            ? `Service resumes on ${formatDay(due.resumesOn)}. This covers the rest of the month from then.`
            : "This month, in full."}
        </p>
        <PayNowButton bookingId={due.bookingId} amountPaise={due.clientTotalPaise} billingEngine="v6" onPaid={onPaid} />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={prepare}
        disabled={busy}
        className="rounded-sm bg-brand px-6 py-3 text-body font-semibold text-brand-ink transition-opacity disabled:opacity-60"
      >
        {busy ? "Working out the amount…" : "Pay to resume"}
      </button>
      {contract.dueCycle ? (
        <p className="text-label text-fg-faint">
          Was {formatPaiseRounded(contract.dueCycle.clientTotalPaise)} for the full month; you pay only the days left.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-body-sm text-fault">
          {error}
        </p>
      ) : null}
    </div>
  );
}
