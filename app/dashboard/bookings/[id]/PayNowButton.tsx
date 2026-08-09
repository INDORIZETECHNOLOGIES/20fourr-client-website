"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { ensureCheckout, RAZORPAY_KEY_ID } from "@/lib/razorpay";
import { rupeesToPaise, type ApiWallet } from "@/lib/api/types";
import { formatPaise, formatPaiseRounded, formatRupees } from "@/lib/money";

/**
 * Payment, at the only point in the lifecycle where it is possible.
 *
 * `POST /payments/create-order` refuses any booking that isn't already
 * `provider_accepted` (or `payment_pending` from a previous attempt). That is
 * why payment is not a step in the booking funnel: at request time there is
 * nothing to charge and the endpoint would reject the call.
 *
 * The order is created server-side, wallet balances are deducted there before
 * the Razorpay order exists, and `amountToPayNow` is the remainder the gateway
 * actually charges — never recompute it here.
 */

type OrderResponse = {
  razorpayOrderId: string;
  /** All integer paise. */
  bookingTotal?: number;
  grandTotal?: number;
  /** What the gateway actually charges — grandTotal minus coins and coupon. */
  amountToPayNow?: number;
  coinsUsed?: number;
  pointsUsed?: number;
  couponCode?: string | null;
  couponDiscount?: number;
  currency?: string;
};




export function PayNowButton({
  bookingId,
  amountPaise,
  onPaid,
}: {
  bookingId: string;
  amountPaise: number;
  onPaid: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useCoins, setUseCoins] = useState(false);
  const [usePoints, setUsePoints] = useState(false);

  const { data: wallet } = useApiQuery<ApiWallet>("wallet");

  /**
   * Balances are whole rupees; `create-order` wants paise. Points are also
   * capped by the platform at `pointUsageLimitPct` of the booking total —
   * sending more is silently reduced server-side, so the figure shown here is
   * the one that will actually apply.
   */
  const coinsAvailablePaise = rupeesToPaise(wallet?.coinBalance ?? 0);
  const pointsCapPaise = Math.round(
    (amountPaise * (wallet?.pointUsageLimitPct ?? 20)) / 100,
  );
  const pointsAvailablePaise = Math.min(
    rupeesToPaise(wallet?.pointBalance ?? 0),
    pointsCapPaise,
  );

  const coinsToUse = useCoins ? Math.min(coinsAvailablePaise, amountPaise) : 0;
  const pointsToUse = usePoints
    ? Math.min(pointsAvailablePaise, Math.max(0, amountPaise - coinsToUse))
    : 0;
  const estimatedDue = Math.max(0, amountPaise - coinsToUse - pointsToUse);

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const order = await api<OrderResponse>("payments/create-order", {
        method: "POST",
        // Wallet is deducted server-side BEFORE the Razorpay order exists, so
        // `amountToPayNow` on the response is the real remainder.
        body: {
          bookingId,
          ...(coinsToUse > 0 ? { coinsToUse } : {}),
          ...(pointsToUse > 0 ? { pointsToUse } : {}),
        },
      });

      const blocked = await ensureCheckout();
      if (blocked) {
        setError(blocked);
        setBusy(false);
        return;
      }

      const checkout = new window.Razorpay!({
        key: RAZORPAY_KEY_ID,
        order_id: order.razorpayOrderId,
        // Wallet coins and any coupon are already deducted server-side before
        // the order exists, so this is the remainder — never the booking total.
        amount: order.amountToPayNow ?? order.grandTotal,
        currency: order.currency ?? "INR",
        name: "20fourr",
        description: "Security booking",
        handler: async (response: Record<string, string>) => {
          try {
            // The signature is verified server-side. A client-side "success"
            // means nothing until the API confirms it.
            //
            // Razorpay's callback uses snake_case (`razorpay_order_id`); the API
            // expects camelCase (`orderId`). Sending Razorpay's own key names
            // straight through fails validation with "Razorpay order ID is
            // required" AFTER the customer has already been charged.
            await api("payments/verify", {
              method: "POST",
              body: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
                bookingId,
              },
            });
            onPaid();
          } catch (cause) {
            setError(
              `${errorMessage(cause)} Your payment may still have gone through — check Bookings before retrying.`,
            );
          } finally {
            setBusy(false);
          }
        },
        modal: {
          ondismiss: () => setBusy(false),
        },
      });

      checkout.open();
    } catch (cause) {
      setError(errorMessage(cause));
      setBusy(false);
    }
  }

  const hasWallet = coinsAvailablePaise > 0 || pointsAvailablePaise > 0;

  return (
    <div className="flex flex-col gap-2">
      {hasWallet ? (
        <div className="rounded-xl border border-app-border bg-app-card p-4">
          <p className="text-[12px] font-semibold uppercase tracking-[1px] text-slate-600">
            Use your wallet
          </p>

          {coinsAvailablePaise > 0 ? (
            <label className="mt-2.5 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={useCoins}
                onChange={(e) => setUseCoins(e.target.checked)}
                className="mt-0.5 h-[17px] w-[17px] shrink-0 accent-app-gold"
              />
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-slate-200">
                  SecureCoins — {formatRupees(wallet?.coinBalance ?? 0)}
                </span>
                <span className="block text-[12px] text-slate-500">
                  Your own refunded money. No cap.
                </span>
              </span>
            </label>
          ) : null}

          {pointsAvailablePaise > 0 ? (
            <label className="mt-2.5 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={usePoints}
                onChange={(e) => setUsePoints(e.target.checked)}
                className="mt-0.5 h-[17px] w-[17px] shrink-0 accent-app-gold"
              />
              <span className="min-w-0">
                <span className="block text-[13.5px] font-semibold text-slate-200">
                  SecurePoints — up to {formatPaise(pointsAvailablePaise, { decimals: 0 })}
                </span>
                <span className="block text-[12px] text-slate-500">
                  Capped at {wallet?.pointUsageLimitPct ?? 20}% of this booking.
                </span>
              </span>
            </label>
          ) : null}

          {coinsToUse + pointsToUse > 0 ? (
            <p className="mt-3 border-t border-white/8 pt-2.5 text-[13px] text-slate-300">
              Wallet covers {formatPaise(coinsToUse + pointsToUse)} — you&apos;ll pay{" "}
              <strong className="text-app-gold">{formatPaiseRounded(estimatedDue)}</strong>{" "}
              by card.
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="rounded-full bg-app-gold-gradient px-6 py-3 text-center text-[14.5px] font-bold text-black transition-transform hover:-translate-y-px disabled:translate-y-0 disabled:opacity-60"
      >
        {busy ? "Opening payment…" : `Pay ${formatPaiseRounded(estimatedDue)}`}
      </button>
      {error ? (
        <p role="alert" className="text-[13px] leading-relaxed text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
