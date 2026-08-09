"use client";

import { useState } from "react";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { ensureCheckout, RAZORPAY_KEY_ID } from "@/lib/razorpay";
import { formatPaiseRounded } from "@/lib/money";

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

  async function pay() {
    setBusy(true);
    setError(null);
    try {
      const order = await api<OrderResponse>("payments/create-order", {
        method: "POST",
        body: { bookingId },
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

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={pay}
        disabled={busy}
        className="rounded-full bg-app-gold-gradient px-6 py-3 text-center text-[14.5px] font-bold text-black transition-transform hover:-translate-y-px disabled:translate-y-0 disabled:opacity-60"
      >
        {busy ? "Opening payment…" : `Pay ${formatPaiseRounded(amountPaise)}`}
      </button>
      {error ? (
        <p role="alert" className="text-[13px] leading-relaxed text-red-300">
          {error}
        </p>
      ) : null}
    </div>
  );
}
