"use client";

import { useState } from "react";
import { Card } from "@/components/dashboard/primitives";
import { CheckCircleFill, CrownFill } from "@/components/dashboard/icons";
import { Notice } from "@/components/ui/Notice";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import { formatApiDate } from "@/lib/api/adapters";
import { ensureCheckout, RAZORPAY_KEY_ID } from "@/lib/razorpay";
import { MEMBERSHIP_BENEFITS } from "@/lib/profile-data";
import { formatPaiseRounded } from "@/lib/money";

/**
 * 20fourr Pass.
 *
 * Prices mirror the API's `PLAN_PRICE_PAISE` — ₹299 monthly, ₹1,999 annual.
 * The previous screen advertised ₹499 and ₹4,990, which were invented; a client
 * would have been quoted one figure and charged another. They are shown from
 * this constant only so the cards can render before an order exists — the
 * amount actually charged is the `amount` the create-order response returns,
 * and that is what goes to Razorpay.
 *
 * Verification takes `{ orderId, paymentId, signature }` — the same shape as
 * booking payment. Razorpay's own callback hands back `razorpay_order_id` and
 * friends, so both call sites must translate; passing the callback object
 * through verbatim fails validation after the customer has been charged.
 */

const PLANS = [
  {
    id: "monthly" as const,
    label: "Monthly",
    pricePaise: 29900,
    period: "per month",
    note: "Cancel anytime",
  },
  {
    id: "annual" as const,
    label: "Annual",
    pricePaise: 199900,
    period: "per year",
    note: "Works out cheaper than 7 months",
    best: true,
  },
];

type Membership = {
  isActive: boolean;
  plan: "none" | "monthly" | "annual" | string;
  activatedAt: string | null;
  expiresAt: string | null;
  prioritySupport: boolean;
  cancelled: boolean;
  cancelledAt: string | null;
  daysRemaining: number | null;
};

type OrderResponse = {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  plan: string;
};

export function MembershipClient() {
  const { data, loading, error, refetch } =
    useApiQuery<{ membership: Membership }>("client/membership");

  const [busy, setBusy] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const membership = data?.membership;

  async function subscribe(plan: "monthly" | "annual") {
    setBusy(plan);
    setActionError(null);
    try {
      const order = await api<OrderResponse>("client/membership/create-order", {
        method: "POST",
        body: { plan },
      });

      const blocked = await ensureCheckout();
      if (blocked) {
        setActionError(blocked);
        setBusy(null);
        return;
      }

      const checkout = new window.Razorpay!({
        key: RAZORPAY_KEY_ID,
        order_id: order.razorpayOrderId,
        amount: order.amount,
        currency: order.currency ?? "INR",
        name: "20fourr",
        description: `20fourr Pass — ${plan}`,
        handler: async (response: Record<string, string>) => {
          try {
            await api("client/membership/verify-payment", {
              method: "POST",
              body: {
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
                signature: response.razorpay_signature,
              },
            });
            refetch();
          } catch (cause) {
            setActionError(
              `${errorMessage(cause)} If you were charged, your Pass may still activate — reload before retrying.`,
            );
          } finally {
            setBusy(null);
          }
        },
        modal: { ondismiss: () => setBusy(null) },
      });

      checkout.open();
    } catch (cause) {
      setActionError(errorMessage(cause));
      setBusy(null);
    }
  }

  async function cancel() {
    setBusy("cancel");
    setActionError(null);
    try {
      await api("client/membership/cancel", { method: "DELETE" });
      setConfirmCancel(false);
      refetch();
    } catch (cause) {
      setActionError(errorMessage(cause));
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <div className="h-[220px] animate-pulse rounded-2xl bg-app-card" />
        <div className="h-[180px] animate-pulse rounded-2xl bg-app-card" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="px-6 py-12 text-center">
        <p role="alert" className="text-[14px] text-red-300">
          {error}
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

  const active = membership?.isActive ?? false;

  return (
    <>
      {actionError ? (
        <p
          role="alert"
          className="mb-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-[14px] text-red-300"
        >
          {actionError}
        </p>
      ) : null}

      {/* Current status */}
      <Card className="relative overflow-hidden p-6 sm:p-7">
        <span
          className="pointer-events-none absolute -right-10 -top-10 h-44 w-44"
          style={{
            background: "radial-gradient(circle, rgba(232,160,32,0.14) 0%, transparent 70%)",
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-app-gold/15 text-app-gold">
              <CrownFill size={22} />
            </span>
            <div>
              <p className="font-display text-[18px] font-extrabold text-slate-100">
                {active ? `${titleCase(membership?.plan ?? "")} Pass` : "No active Pass"}
              </p>
              <p className="text-[13px] text-slate-500">
                {active
                  ? membership?.expiresAt
                    ? `Renews ${formatApiDate(membership.expiresAt)}${
                        membership.daysRemaining !== null
                          ? ` · ${membership.daysRemaining} days left`
                          : ""
                      }`
                    : "Active"
                  : "Subscribe to unlock member benefits"}
              </p>
            </div>
          </div>

          {active ? (
            <span className="rounded-full bg-green-500/14 px-4 py-1.5 text-[13px] font-bold text-green-500">
              Active
            </span>
          ) : null}
        </div>

        {/* Cancelled but still running — the API keeps benefits until expiry. */}
        {active && membership?.cancelled ? (
          <div className="relative mt-5">
            <Notice>
              Auto-renewal is off. Your benefits continue until{" "}
              {formatApiDate(membership.expiresAt)}, then the Pass ends.
            </Notice>
          </div>
        ) : null}

        <ul className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {MEMBERSHIP_BENEFITS.map((b) => (
            <li key={b} className="flex items-start gap-2.5">
              <span className={active ? "mt-0.5 text-green-500" : "mt-0.5 text-slate-600"}>
                <CheckCircleFill size={16} />
              </span>
              <span
                className={[
                  "text-[13.5px] leading-relaxed",
                  active ? "text-slate-300" : "text-slate-500",
                ].join(" ")}
              >
                {b}
              </span>
            </li>
          ))}
        </ul>
      </Card>

      {active ? (
        membership?.cancelled ? null : (
          <div className="mt-4">
            {confirmCancel ? (
              <Card className="border-red-500/35 p-5">
                <p className="text-[14.5px] font-semibold text-red-300">
                  Turn off auto-renewal?
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-400">
                  Your benefits continue until{" "}
                  {formatApiDate(membership?.expiresAt)} — nothing is refunded and
                  nothing is lost today. The Pass simply won&apos;t renew.
                </p>
                <div className="mt-4 flex gap-2">
                  <button
                    type="button"
                    onClick={cancel}
                    disabled={busy === "cancel"}
                    className="rounded-full bg-red-500/90 px-6 py-2 text-[13.5px] font-bold text-white disabled:opacity-60"
                  >
                    {busy === "cancel" ? "Cancelling…" : "Yes, cancel"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmCancel(false)}
                    className="rounded-full border border-app-border px-6 py-2 text-[13.5px] font-semibold text-slate-300"
                  >
                    Keep it
                  </button>
                </div>
              </Card>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmCancel(true)}
                className="rounded-full border border-app-border px-6 py-2.5 text-[13.5px] font-semibold text-slate-400 transition-colors hover:bg-white/5"
              >
                Cancel membership
              </button>
            )}
          </div>
        )
      ) : (
        <>
          <h3 className="mb-3 mt-8 text-[12px] font-semibold uppercase tracking-[1.2px] text-slate-500">
            Choose a plan
          </h3>
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {PLANS.map((p) => (
              <Card
                key={p.id}
                className={[
                  "relative p-6",
                  p.best ? "border-app-gold/45" : "",
                ].join(" ")}
              >
                {p.best ? (
                  <span className="absolute right-5 top-5 rounded-full bg-app-gold/15 px-3 py-1 text-[11px] font-bold text-app-gold">
                    Best value
                  </span>
                ) : null}
                <p className="text-[14px] font-semibold text-slate-300">{p.label}</p>
                <p className="mt-2 font-display text-[30px] font-extrabold leading-none text-slate-100">
                  {formatPaiseRounded(p.pricePaise)}
                </p>
                <p className="mt-1.5 text-[13px] text-slate-500">{p.period}</p>
                <p className="mt-1 text-[12.5px] text-slate-600">{p.note}</p>

                <button
                  type="button"
                  onClick={() => subscribe(p.id)}
                  disabled={busy !== null}
                  className="mt-5 w-full rounded-full bg-app-gold-gradient py-3 text-[14.5px] font-bold text-black transition-transform hover:-translate-y-px disabled:translate-y-0 disabled:opacity-60"
                >
                  {busy === p.id ? "Opening payment…" : `Get ${p.label} Pass`}
                </button>
              </Card>
            ))}
          </div>
          <p className="mt-3 text-[12.5px] text-slate-600">
            Billed once through Razorpay. The Pass does not auto-charge again — renew
            manually when it expires.
          </p>
        </>
      )}
    </>
  );
}

function titleCase(s: string): string {
  return s ? s[0].toUpperCase() + s.slice(1) : s;
}
