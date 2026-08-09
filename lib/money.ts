/**
 * Money formatting — ported from the production app
 * (SecureConnect/mobile/src/utils/formatters.js).
 *
 * THE BACKEND LEDGER STORES EVERY MONETARY VALUE IN PAISE as a rounded integer,
 * so an amount can carry non-zero paise (₹1,234.56). Displaying one must:
 *
 *   1. divide by 100 exactly ONCE, and
 *   2. NOT round each line independently — otherwise breakdown line items stop
 *      summing to the displayed total, and a "Pay ₹X" button can overstate the
 *      real charge.
 *
 * Keep the signature identical to the app's so the payment and invoice screens
 * port across without a semantic change. `decimals` defaults to 2, as it does
 * there; pass `{ decimals: 0 }` ONLY for rounded summaries where exact
 * reconciliation isn't required — dashboard headline numbers, list cards.
 * Never for a payment breakdown or an invoice line.
 */
export function formatPaise(paise: number, { decimals = 2 }: { decimals?: number } = {}) {
  const rupees = (Number(paise) || 0) / 100;
  return `₹${rupees.toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

/** Convenience for whole-rupee summary display. */
export function formatPaiseRounded(paise: number) {
  return formatPaise(paise, { decimals: 0 });
}

/** "From ₹250/hr" — service catalogue rates, which are always whole rupees. */
export function formatHourlyRate(paise: number) {
  return `${formatPaise(paise, { decimals: 0 })}/hr`;
}

/** Rupees → paise. Use when authoring fixtures, never on user input mid-flow. */
export function rupees(amount: number): number {
  return Math.round(amount * 100);
}

/**
 * THE WALLET IS THE ONE EXCEPTION TO THE PAISE RULE.
 *
 * `coinBalance` and `pointBalance` are counts of SecureCoins and SecurePoints,
 * and the Wallet model states the rate plainly: **1 Coin = 1 Rupee, 1 Point = 1
 * Rupee**. They are whole rupees, not paise.
 *
 * Putting a balance of 2400 through formatPaise would print ₹24 — a hundredfold
 * understatement of the user's own refunded money. Use this instead, and never
 * mix the two: coins and points are separate ledgers and cannot be added
 * together or converted into each other.
 */
export function formatRupees(amount: number, { decimals = 0 }: { decimals?: number } = {}) {
  return `₹${(Number(amount) || 0).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}
