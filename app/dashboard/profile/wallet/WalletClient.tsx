"use client";

import { SectionLabel } from "@/components/dashboard/SubPage";
import { Card } from "@/components/dashboard/primitives";
import { StarFill, WalletIcon } from "@/components/dashboard/icons";
import { useApiQuery } from "@/hooks/useApiQuery";
import { relativeTime } from "@/lib/api/adapters";
import type { ApiWallet } from "@/lib/api/types";
import { EARN_METHODS } from "@/lib/profile-data";
import { formatRupees } from "@/lib/money";

/**
 * Reason codes are snake_case internal labels ("booking_refund"). Anything not
 * listed falls through to a de-underscored version rather than being shown raw.
 */
const REASON_LABELS: Record<string, string> = {
  booking_refund: "Booking refund",
  referral_reward: "Referral reward",
  referral_bonus: "Referral bonus",
  signup_bonus: "Signup bonus",
  milestone_bonus: "Milestone bonus",
  booking_payment: "Used on a booking",
  rating_reward: "Rating reward",
  expiry: "Expired",
  admin_credit: "Credited by support",
  admin_debit: "Adjusted by support",
};

function reasonLabel(reason: string): string {
  return REASON_LABELS[reason] ?? reason.replace(/_/g, " ").replace(/^./, (c) => c.toUpperCase());
}

export function WalletClient() {
  const { data, loading, error, refetch } = useApiQuery<ApiWallet>("wallet");

  if (loading) {
    return (
      <div className="flex flex-col gap-3.5">
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div className="h-[132px] animate-pulse rounded-lg bg-panel" />
          <div className="h-[132px] animate-pulse rounded-lg bg-panel" />
        </div>
        <div className="h-[220px] animate-pulse rounded-lg bg-panel" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="px-6 py-12 text-center">
        <p role="alert" className="text-body text-fault">
          {error ?? "Couldn't load your wallet."}
        </p>
        <button
          type="button"
          onClick={refetch}
            className="mt-4 rounded-sm border border-edge px-6 py-2.5 text-body-sm font-medium text-fg"
        >
          Try again
        </button>
      </Card>
    );
  }

  const transactions = data.transactions ?? [];
  const expiringPoints = transactions
    .filter((t) => t.currency === "point" && t.type === "credit" && !t.expired && t.expiresAt)
    .filter((t) => {
      const days = (new Date(t.expiresAt as string).getTime() - Date.now()) / 86_400_000;
      return days > 0 && days <= 7;
    })
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <>
      {/* Two balances — deliberately distinct, they are not interchangeable and
          cannot be converted into each other. Both are whole rupees. */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-body-sm font-medium text-fg-faint">SecureCoins</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-panel-raised text-fg">
              <WalletIcon size={16} />
            </span>
          </div>
          <p className="text-mono-lg tabular-nums leading-none text-fg">
            {formatRupees(data.coinBalance)}
          </p>
          <p className="mt-2 text-label text-fg-faint">
            Your own refunded money · no cap at checkout
          </p>
          <p className="mt-1 text-label text-fg-faint">
            {formatRupees(data.coinLifetimeEarned)} earned ·{" "}
            {formatRupees(data.coinLifetimeSpent)} spent
          </p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-body-sm font-medium text-fg-faint">SecurePoints</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-panel-raised text-fg-mid">
              <StarFill size={16} />
            </span>
          </div>
          <p className="text-mono-lg tabular-nums leading-none text-fg">
            {formatRupees(data.pointBalance)}
          </p>
          {/* The API has no tier system — the real constraint on points is the
              per-booking usage cap, so that is what belongs here. */}
          <p className="mt-2 text-label text-fg-faint">
            Platform rewards · up to {data.pointUsageLimitPct}% of any booking total
          </p>
          <p className="mt-1 text-label text-fg-faint">
            {formatRupees(data.pointLifetimeEarned)} earned ·{" "}
            {formatRupees(data.pointLifetimeSpent)} spent
          </p>
        </Card>
      </div>

      {expiringPoints > 0 ? (
        <p className="mt-3 rounded-lg border border-edge bg-panel-raised px-4 py-3 text-body-sm text-attention">
          {formatRupees(expiringPoints)} in SecurePoints expires within 7 days.
        </p>
      ) : (
        <p className="mt-3 text-body-sm text-fg-faint">
          Coins and points expire {data.walletExpiryDays} days after they are credited.
        </p>
      )}

      <SectionLabel>Transaction history</SectionLabel>
      {transactions.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <p className="text-body text-fg-faint">No transactions yet.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {transactions.map((t, i) => {
            const credit = t.type === "credit";
            return (
              <div
                key={t._id ?? i}
                className={[
                  "flex items-center gap-4 px-5 py-4",
                  i < transactions.length - 1 ? "border-b border-hairline" : "",
                  t.expired ? "opacity-50" : "",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-body font-semibold text-fg">
                    {reasonLabel(t.reason)}
                  </p>
                  <p className="mt-0.5 truncate text-body-sm text-fg-faint">
                    {t.currency === "coin" ? "SecureCoins" : "SecurePoints"}
                    {t.description ? ` · ${t.description}` : ""}
                    {t.createdAt ? ` · ${relativeTime(t.createdAt)}` : ""}
                    {t.expired ? " · expired" : ""}
                  </p>
                </div>
                <p
                  className={[
                    "shrink-0 text-body font-semibold",
                    credit ? "text-live" : "text-fg-mid",
                  ].join(" ")}
                >
                  {credit ? "+" : "−"}
                  {formatRupees(Math.abs(t.amount))}
                </p>
              </div>
            );
          })}
        </Card>
      )}

      <SectionLabel>How to Earn</SectionLabel>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {EARN_METHODS.map((m) => (
          <Card key={m.title} className="p-5">
            <p className="text-body font-semibold text-fg">{m.title}</p>
            <p className="mt-1.5 text-body-sm leading-relaxed text-fg-faint">{m.body}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
