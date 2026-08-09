/**
 * The cancellation refund policy — one definition, used by every screen that
 * mentions it.
 *
 * WHY THIS FILE EXISTS. Three screens each carried their own hand-written
 * version of this policy and all three were wrong in the same invented way:
 * "free until the provider accepts, then cancelling within 6 hours of the start
 * time is charged at 50% of the base amount." Every part of that was fiction —
 * wrong window (6h), wrong direction (a 50% *charge* rather than a 50%
 * *refund*), and it hung the tiers off provider acceptance rather than the duty
 * start time.
 *
 * The real rule is the server's, in utils/pricing.ts →
 * calculateCancellationRefund, driven by settings:
 *
 *   cancellationTier1Hours: 24   cancellationTier1Refund: 0.9
 *   cancellationTier2Hours: 12   cancellationTier2Refund: 0.5
 *                                cancellationTier3Refund: 0
 *
 * Two details the app's own UI states loosely and this does not:
 *
 *  - The >24h tier is **90%, not 100%**. The mobile screen labels it "Full
 *    refund" and the FAQ says "without penalty"; the server refunds 0.9. Saying
 *    "full" would overstate what a client gets back by 10%.
 *  - Refunds are credited as **SecureCoins**, not returned to the card
 *    (`refundAsCoins: true`).
 *
 * These are settings, so an admin can change them. If the numbers here ever
 * disagree with the server, the server wins — and this file should be updated,
 * not the screens.
 */

export type RefundTier = {
  /** Hours before duty start, as the lower bound of this band. */
  fromHours: number;
  label: string;
  /** Percentage of the booking total refunded. */
  percent: number;
  detail: string;
};

export const REFUND_TIERS: RefundTier[] = [
  {
    fromHours: 24,
    label: "More than 24 hours before",
    percent: 90,
    detail: "Most of what you paid comes back.",
  },
  {
    fromHours: 12,
    label: "12–24 hours before",
    percent: 50,
    detail: "Half is refunded; the rest covers the provider's held slot.",
  },
  {
    fromHours: 0,
    label: "Less than 12 hours before",
    percent: 0,
    detail: "No refund — the provider has already committed the shift.",
  },
];

/** One-line summary for tight spaces. */
export const CANCELLATION_SUMMARY =
  "Cancel more than 24 hours before the start time for a 90% refund, 50% between 12 and 24 hours, and nothing under 12 hours.";

/** Where the money goes back to. Stated wherever a refund is mentioned. */
export const REFUND_DESTINATION =
  "Refunds are credited to your wallet as SecureCoins, not back to your card.";

/** True before any payment exists, where nothing can be withheld. */
export const NOTHING_CHARGED_YET =
  "Nothing is charged until the provider accepts and you pay, so cancelling before that costs nothing.";
