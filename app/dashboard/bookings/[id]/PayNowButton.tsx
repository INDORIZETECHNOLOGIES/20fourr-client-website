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
  billingEngine,
  onPaid,
}: {
  bookingId: string;
  amountPaise: number;
  billingEngine?: string | null;
  onPaid: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [useCoins, setUseCoins] = useState(false);
  const [usePoints, setUsePoints] = useState(false);

  const { data: wallet } = useApiQuery<ApiWallet>("wallet", {
    enabled: billingEngine !== "v6",
  });

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

  const v6 = billingEngine === "v6";
  const coinsToUse = !v6 && useCoins ? Math.min(coinsAvailablePaise, amountPaise) : 0;
  const pointsToUse =
    !v6 && usePoints
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
          ...(!v6 && coinsToUse > 0 ? { coinsToUse } : {}),
          ...(!v6 && pointsToUse > 0 ? { pointsToUse } : {}),
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

  const hasWallet = !v6 && (coinsAvailablePaise > 0 || pointsAvailablePaise > 0);

  return (
    <div className="flex flex-col gap-2">
      {hasWallet ? (
        <div className="rounded-lg border border-hairline bg-panel p-4">
          <p className="text-label font-semibold uppercase tracking-[1px] text-fg-faint">
            Use your wallet
          </p>

          {coinsAvailablePaise > 0 ? (
            <label className="mt-2.5 flex cursor-pointer items-start gap-3">
              <input
                type="checkbox"
                checked={useCoins}
                onChange={(e) => setUseCoins(e.target.checked)}
                className="mt-0.5 h-[17px] w-[17px] shrink-0 accent-brand"
              />
              <span className="min-w-0">
                <span className="block text-body-sm font-semibold text-fg">
                  SecureCoins — {formatRupees(wallet?.coinBalance ?? 0)}
                </span>
                <span className="block text-label text-fg-faint">
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
                className="mt-0.5 h-[17px] w-[17px] shrink-0 accent-brand"
              />
              <span className="min-w-0">
                <span className="block text-body-sm font-semibold text-fg">
                  SecurePoints — up to {formatPaise(pointsAvailablePaise, { decimals: 0 })}
                </span>
                <span className="block text-label text-fg-faint">
                  Capped at {wallet?.pointUsageLimitPct ?? 20}% of this booking.
                </span>
              </span>
            </label>
          ) : null}

          {coinsToUse + pointsToUse > 0 ? (
            <p className="mt-3 border-t border-hairline pt-2.5 text-body-sm text-fg-mid">
              Wallet covers {formatPaise(coinsToUse + pointsToUse)} — you&apos;ll pay{" "}
              <strong className="text-fg">{formatPaiseRounded(estimatedDue)}</strong>{" "}
              by card.
            </p>
          ) : null}
        </div>
      ) : null}

      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="rounded-sm bg-brand text-brand-ink px-6 py-3 text-center text-body font-semibold transition-opacity   disabled:opacity-60"
      >
        {busy ? "Opening payment…" : `Pay ${formatPaiseRounded(estimatedDue)}`}
      </button>
      {error ? (
        <p role="alert" className="text-body-sm leading-relaxed text-fault">
          {error}
        </p>
      ) : null}
    </div>
  );
}
