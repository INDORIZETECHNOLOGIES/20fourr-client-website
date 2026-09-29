"use client";

import { useState } from "react";
import { Card } from "@/components/dashboard/primitives";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { ApiContract } from "@/lib/api/types";

/**
 * Ending a contract (0014 rule 11). Before it has started (`accepted`, nothing paid) this cancels
 * it outright. After that it's notice: the contract runs to the end of the month in which the
 * notice period ends, and the server returns the exact date.
 */
export function NoticePanel({ contract, onChange }: { contract: ApiContract; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (contract.terminationNotice) return null;
  const beforeStart = contract.status === "accepted";

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      await api(`contracts/${contract._id}/terminate`, {
        method: "POST",
        body: { reason: reason.trim() || null },
      });
      setOpen(false);
      onChange();
    } catch (cause) {
      setError(errorMessage(cause));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <h3 className="text-body font-semibold text-fg">{beforeStart ? "Cancel contract" : "End contract"}</h3>
      <p className="mt-1.5 text-body-sm leading-relaxed text-fg-mid">
        {beforeStart
          ? "Nothing has been paid yet, so cancelling ends it straight away."
          : "Give notice and the contract runs to the end of the month your notice period ends in. You'll see the end date as soon as you give it."}
      </p>

      {open ? (
        <div className="mt-4">
          <label htmlFor="notice-reason" className="mb-1.5 block text-label text-fg-faint">
            Reason (optional, shared with the provider)
          </label>
          <textarea
            id="notice-reason"
            rows={2}
            maxLength={500}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-sm border border-hairline bg-panel-raised px-3 py-2 text-body-sm text-fg outline-none focus:border-edge"
          />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="rounded-sm border border-fault px-5 py-2.5 text-body-sm font-semibold text-fault disabled:opacity-60"
            >
              {busy ? "Sending…" : beforeStart ? "Cancel contract" : "Give notice"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="rounded-sm border border-hairline px-5 py-2.5 text-body-sm font-medium text-fg-mid hover:border-edge"
            >
              Keep it
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 rounded-sm border border-hairline px-5 py-2.5 text-body-sm font-medium text-fg-mid transition-colors hover:border-edge hover:text-fg"
        >
          {beforeStart ? "Cancel contract" : "Give notice"}
        </button>
      )}

      {error ? (
        <p role="alert" className="mt-3 text-body-sm text-fault">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
