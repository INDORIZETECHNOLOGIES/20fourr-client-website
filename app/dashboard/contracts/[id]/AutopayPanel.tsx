"use client";

import { useState } from "react";
import { Card } from "@/components/dashboard/primitives";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { ApiContract, MandateMethod, MandateOrder } from "@/lib/api/types";
import { MANDATE_METHOD_LABEL, mandateSummary } from "@/lib/contracts";
import { ensureCheckout, RAZORPAY_KEY_ID } from "@/lib/razorpay";

const METHODS: { id: MandateMethod; note: string }[] = [
  { id: "emandate", note: "From your bank account. Works for any amount; your bank confirms it in a few days." },
  { id: "upi", note: "Only for months under the no-OTP limit." },
  { id: "card", note: "Only for months under the no-OTP limit." },
];

/**
 * Autopay for later months (0014 build decision 4): registering a mandate is its own step, not
 * part of paying the first month. POST /contracts/:id/mandate returns an order that Razorpay
 * Checkout opens with `recurring`. There's no verify call: the bank's decision arrives as a
 * token webhook, so after checkout the mandate reads "waiting for your bank" until it does.
 */
export function AutopayPanel({ contract, onChange }: { contract: ApiContract; onChange: () => void }) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<MandateMethod>("emandate");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const status = contract.mandate.status;

  async function register() {
    setBusy(true);
    setError(null);
    try {
      const order = await api<MandateOrder>(`contracts/${contract._id}/mandate`, { method: "POST", body: { method } });
      const blocked = await ensureCheckout();
      if (blocked) {
        setError(blocked);
        setBusy(false);
        onChange();
        return;
      }
      const checkout = new window.Razorpay!({
        key: RAZORPAY_KEY_ID,
        order_id: order.orderId,
        customer_id: order.customerId,
        recurring: "1",
        amount: order.amount,
        currency: "INR",
        name: "20fourr",
        description: `Autopay for contract ${contract.contractId}`,
        handler: () => {
          setSubmitted(true);
          setOpen(false);
          setBusy(false);
          onChange();
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            onChange();
          },
        },
      });
      checkout.open();
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <h3 className="text-body font-semibold text-fg">Autopay</h3>
      <p className="mt-1.5 text-body-sm leading-relaxed text-fg-mid">
        {submitted ? "Sent to your bank. It usually confirms within a few days; until then, pay each month here." : mandateSummary(contract.mandate)}
      </p>

      {open ? (
        <fieldset className="mt-4 flex flex-col gap-2">
          <legend className="mb-2 text-label font-semibold uppercase tracking-[1px] text-fg-faint">Pay by</legend>
          {METHODS.map((m) => (
            <label
              key={m.id}
              className={[
                "flex cursor-pointer items-start gap-3 rounded-sm border px-3 py-2.5",
                method === m.id ? "border-edge bg-panel-raised" : "border-hairline",
              ].join(" ")}
            >
              <input
                type="radio"
                name="mandate-method"
                checked={method === m.id}
                onChange={() => setMethod(m.id)}
                className="mt-1 accent-[var(--color-brand)]"
              />
              <span>
                <span className="block text-body-sm font-medium text-fg">{MANDATE_METHOD_LABEL[m.id]}</span>
                <span className="block text-label text-fg-faint">{m.note}</span>
              </span>
            </label>
          ))}
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={register}
              disabled={busy}
              className="rounded-sm bg-brand px-5 py-2.5 text-body-sm font-semibold text-brand-ink disabled:opacity-60"
            >
              {busy ? "Opening…" : "Continue"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={busy}
              className="rounded-sm border border-hairline px-5 py-2.5 text-body-sm font-medium text-fg-mid hover:border-edge"
            >
              Not now
            </button>
          </div>
        </fieldset>
      ) : !submitted ? (
        // "pending" is set when the order is created, before checkout, so a closed checkout leaves
        // it pending too. Starting again is always allowed; the server replaces the order.
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-4 rounded-sm border border-edge px-5 py-2.5 text-body-sm font-medium text-fg transition-colors hover:bg-panel-raised"
        >
          {status === "confirmed" ? "Change bank mandate" : status === "pending" ? "Start again" : "Set up autopay"}
        </button>
      ) : null}

      {error ? (
        <p role="alert" className="mt-3 text-body-sm text-fault">
          {error}
        </p>
      ) : null}
    </Card>
  );
}
