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
 *  - Where the money goes depends on the billing engine (spec 0002 rule 8).
 *    v1 credits SecureCoins. v6 records a payable and does not disburse it.
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

export type BillingEngine = "v1" | "v6";

/**
 * Where a refund goes.
 *
 * The v6 destination is decided, and it is a real gateway refund to the
 * original payment method: Platform Architecture v6.0 §H ("Reversal on
 * cancellation — before any transfer: POST /v1/refunds"), §G.1 ("Full refund to
 * client … per Razorpay refund timeline") and §S-2. It is NOT wallet credit,
 * which is the v1 behaviour and is being retired with v1.
 *
 * The gap is implementation, not policy: as of CLIENT_API_REFERENCE Appendix B
 * the v6 cancel path records a credit note and sets `refundStatus: 'pending'`,
 * and nothing in `src/billing/settlement/` calls the Razorpay refund API yet.
 * So the copy states the destination the architecture commits to, and is honest
 * that the timing is not yet automatic — rather than either promising a speed
 * nothing delivers, or implying the money may never come back.
 *
 * Tighten this once the refund-release job exists — SecureConnect spec 0009
 * ("Refund payable release") specifies it, including the exact `settled` copy
 * this should become. The architecture defers to "Razorpay refund timeline" and
 * names no number itself, so naming one here would be inventing it.
 */
export function refundDestination(engine: BillingEngine): string {
  if (engine === "v6") {
    return "Refunds go back to the payment method you used, not to a wallet.";
  }
  return "Refunds are credited to your wallet as SecureCoins, not back to your card.";
}

export type RefundState =
  | "pending"
  | "releasing"
  | "settled"
  | "failed"
  | "manual_review";

/**
 * What to tell the client about a refund that already exists, per SecureConnect
 * spec 0009's UI table.
 *
 * Three rules that hold across all of these: never name a date the platform does
 * not control (the instrument timeline is Razorpay's, quoted as theirs), never
 * surface a gateway id or a failure reason, and never imply the money may not
 * come back. A refund needing manual review is late, not lost.
 */
export function refundNotice(
  state: RefundState | null | undefined,
  amountLabel: string,
  engine: BillingEngine,
  settledAt?: string | null,
): { tone: "pending" | "done" | "attention"; text: string } | null {
  if (!state) return null;

  // The destination differs by engine and the copy must too: a v1 refund becomes
  // SecureCoins in the wallet and never touches the card, a v6 refund goes back
  // to the instrument and never touches the wallet. One sentence for both would
  // be wrong for one of them.
  const destination =
    engine === "v6" ? "your original payment method" : "your wallet as SecureCoins";

  if (state === "settled") {
    const when = settledAt
      ? new Date(settledAt).toLocaleDateString("en-IN", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : null;
    const trailer =
      engine === "v6" ? " Your bank may take a few working days to show it." : "";
    return {
      tone: "done",
      text: `${amountLabel} refunded to ${destination}${when ? ` on ${when}` : ""}.${trailer}`,
    };
  }

  if (state === "failed" || state === "manual_review") {
    return {
      tone: "attention",
      text: `${amountLabel} refund needs a manual check. Our team has been notified — contact support with this booking if you don't hear back.`,
    };
  }

  return {
    tone: "pending",
    text: `${amountLabel} refund is being sent to ${destination}.`,
  };
}

/** True before any payment exists, where nothing can be withheld. */
export const NOTHING_CHARGED_YET =
  "Nothing is charged until the provider accepts and you pay, so cancelling before that costs nothing.";

/**
 * The refund for cancelling *now*, given when duty starts.
 *
 * The app's cancellation screen shows this rather than only the tier table —
 * "you get ₹X back" is the question someone actually has. Advisory only: the
 * server recomputes on cancel, and an admin can change the tiers.
 */
export function refundForCancellation(
  totalPaise: number,
  dutyStartsAt: Date | null,
): { percent: number; refundPaise: number; hoursRemaining: number | null } {
  if (!dutyStartsAt || Number.isNaN(dutyStartsAt.getTime())) {
    return { percent: 0, refundPaise: 0, hoursRemaining: null };
  }
  const hours = (dutyStartsAt.getTime() - Date.now()) / 3_600_000;

  /*
   * Mirrors calculateCancellationRefund in utils/pricing.ts expression for
   * expression, including its asymmetric comparisons: the top band is a strict
   * `>` and the middle band is `>=`. Scanning the tiers with a uniform `>` is
   * the obvious way to write this and it is wrong at exactly 12 hours, where it
   * reports 0% against a server that refunds 50% — understating a refund at the
   * one moment the number decides whether someone cancels.
   */
  const [tier1, tier2, tier3] = REFUND_TIERS;
  const tier =
    hours > tier1.fromHours ? tier1 : hours >= tier2.fromHours ? tier2 : tier3;
  return {
    percent: tier.percent,
    refundPaise: Math.round((totalPaise * tier.percent) / 100),
    hoursRemaining: Math.max(0, hours),
  };
}
