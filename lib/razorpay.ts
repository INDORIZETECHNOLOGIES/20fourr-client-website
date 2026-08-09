"use client";

/**
 * Razorpay checkout loading, shared by booking payment and membership.
 *
 * Two flows use the gateway and they do NOT share a request shape — booking
 * verification posts `razorpay_order_id / razorpay_payment_id /
 * razorpay_signature`, while membership verification posts `orderId /
 * paymentId / signature`. Only the script loading and the key are common, so
 * only that lives here.
 */

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

/**
 * The publishable half of the pair. It is meant to be in the bundle — checkout
 * cannot run without it — and is useless alone: orders are created and
 * signatures verified with the secret, which never leaves the API.
 */
export const RAZORPAY_KEY_ID = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

const SCRIPT_SRC = "https://checkout.razorpay.com/v1/checkout.js";

export function loadRazorpay(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);

  return new Promise((resolve) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${SCRIPT_SRC}"]`);
    if (existing) {
      existing.addEventListener("load", () => resolve(true));
      existing.addEventListener("error", () => resolve(false));
      return;
    }
    const script = document.createElement("script");
    script.src = SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/** Shared preflight: returns an error message, or null when checkout can run. */
export async function ensureCheckout(): Promise<string | null> {
  if (!RAZORPAY_KEY_ID) {
    return "Payments aren't configured — NEXT_PUBLIC_RAZORPAY_KEY_ID is not set.";
  }
  const ready = await loadRazorpay();
  if (!ready || !window.Razorpay) {
    return "Couldn't load the payment gateway. Check your connection or any ad blocker and try again.";
  }
  return null;
}
