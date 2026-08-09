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
          <div className="h-[132px] animate-pulse rounded-2xl bg-app-card" />
          <div className="h-[132px] animate-pulse rounded-2xl bg-app-card" />
        </div>
        <div className="h-[220px] animate-pulse rounded-2xl bg-app-card" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <Card className="px-6 py-12 text-center">
        <p role="alert" className="text-[14px] text-red-300">
          {error ?? "Couldn't load your wallet."}
        </p>
        <button
          type="button"
          onClick={refetch}
          className="mt-4 rounded-full border border-app-gold px-6 py-2.5 text-[13px] font-bold text-app-gold"
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
            <span className="text-[12.5px] font-medium text-slate-500">SecureCoins</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-app-gold/12 text-app-gold">
              <WalletIcon size={16} />
            </span>
          </div>
          <p className="font-display text-[30px] font-extrabold leading-none text-slate-100">
            {formatRupees(data.coinBalance)}
          </p>
          <p className="mt-2 text-[12px] text-slate-500">
            Your own refunded money · no cap at checkout
          </p>
          <p className="mt-1 text-[12px] text-slate-600">
            {formatRupees(data.coinLifetimeEarned)} earned ·{" "}
            {formatRupees(data.coinLifetimeSpent)} spent
          </p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[12.5px] font-medium text-slate-500">SecurePoints</span>
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-app-info/12 text-app-info">
              <StarFill size={16} />
            </span>
          </div>
          <p className="font-display text-[30px] font-extrabold leading-none text-slate-100">
            {formatRupees(data.pointBalance)}
          </p>
          {/* The API has no tier system — the real constraint on points is the
              per-booking usage cap, so that is what belongs here. */}
          <p className="mt-2 text-[12px] text-slate-500">
            Platform rewards · up to {data.pointUsageLimitPct}% of any booking total
          </p>
          <p className="mt-1 text-[12px] text-slate-600">
            {formatRupees(data.pointLifetimeEarned)} earned ·{" "}
            {formatRupees(data.pointLifetimeSpent)} spent
          </p>
        </Card>
      </div>

      {expiringPoints > 0 ? (
        <p className="mt-3 rounded-xl border border-app-gold/30 bg-app-gold/8 px-4 py-3 text-[13.5px] text-app-gold">
          {formatRupees(expiringPoints)} in SecurePoints expires within 7 days.
        </p>
      ) : (
        <p className="mt-3 text-[12.5px] text-slate-600">
          Coins and points expire {data.walletExpiryDays} days after they are credited.
        </p>
      )}

      <SectionLabel>Transaction History</SectionLabel>
      {transactions.length === 0 ? (
        <Card className="px-6 py-12 text-center">
          <p className="text-[14px] text-slate-500">No transactions yet.</p>
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
                  i < transactions.length - 1 ? "border-b border-white/6" : "",
                  t.expired ? "opacity-50" : "",
                ].join(" ")}
              >
                <div className="min-w-0 flex-1">
                  <p className="text-[14.5px] font-semibold text-slate-100">
                    {reasonLabel(t.reason)}
                  </p>
                  <p className="mt-0.5 truncate text-[12.5px] text-slate-500">
                    {t.currency === "coin" ? "SecureCoins" : "SecurePoints"}
                    {t.description ? ` · ${t.description}` : ""}
                    {t.createdAt ? ` · ${relativeTime(t.createdAt)}` : ""}
                    {t.expired ? " · expired" : ""}
                  </p>
                </div>
                <p
                  className={[
                    "shrink-0 text-[15px] font-bold",
                    credit ? "text-green-500" : "text-slate-300",
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
            <p className="text-[14.5px] font-bold text-slate-100">{m.title}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-500">{m.body}</p>
          </Card>
        ))}
      </div>
    </>
  );
}
