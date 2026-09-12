"use client";

import { useState } from "react";
import { useApiQuery } from "@/hooks/useApiQuery";
import { api } from "@/lib/api/client";
import { errorMessage } from "@/lib/api/errors";
import type { AvailableCoupon, CouponBreakdown } from "@/lib/api/types";
import { formatPaise, formatPaiseRounded } from "@/lib/money";

/**
 * Coupon entry, on the Confirm step.
 *
 * It belongs here rather than at payment because `couponCode` is part of the
 * `POST /bookings` body — the server validates and applies it while pricing the
 * booking. `/coupons/validate` is a *preview* only: it reserves nothing, so the
 * authoritative discount is whatever comes back on the created booking.
 *
 * `/coupons/available` lists what this client can actually use, which beats
 * making them guess a code.
 */
export function CouponField({
  totalPaise,
  serviceCategory,
  platformRevenuePaise,
  value,
  onChange,
}: {
  totalPaise: number;
  serviceCategory: string | null;
  /** Some coupons only discount the platform's cut, so this changes the result. */
  platformRevenuePaise: number;
  value: string | null;
  /** discountPaise is informational — the server re-computes on create. */
  onChange: (code: string | null, discountPaise: number) => void;
}) {
  const { data: available } = useApiQuery<{ coupons: AvailableCoupon[] }>(
    "coupons/available",
  );

  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applied, setApplied] = useState<CouponBreakdown | null>(null);

  async function apply(raw: string) {
    const trimmed = raw.trim().toUpperCase();
    if (!trimmed) return;

    setChecking(true);
    setError(null);
    try {
      const breakdown = await api<CouponBreakdown>("coupons/validate", {
        method: "POST",
        body: {
          code: trimmed,
          totalAmountPaise: totalPaise,
          serviceCategory,
          platformRevenuePaise,
        },
      });
      setApplied(breakdown);
      setCode(trimmed);
      onChange(breakdown.code, breakdown.discountAmountPaise);
    } catch (cause) {
      setApplied(null);
      onChange(null, 0);
      setError(errorMessage(cause));
    } finally {
      setChecking(false);
    }
  }

  function remove() {
    setApplied(null);
    setCode("");
    setError(null);
    onChange(null, 0);
  }

  if (value && applied) {
    return (
      <div className="rounded-lg border border-live bg-transparent px-4 py-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-body font-semibold text-live">
            {applied.code} applied
          </p>
          <button
            type="button"
            onClick={remove}
            className="text-body-sm font-semibold text-fg-mid hover:text-fg"
          >
            Remove
          </button>
        </div>
        <p className="mt-1 text-body-sm text-fg-mid">
          {applied.name ? `${applied.name} — ` : ""}
          saves {formatPaise(applied.discountAmountPaise)}, new total{" "}
          {formatPaiseRounded(applied.finalAmountPaise)}.
        </p>
        {/* The preview is not a guarantee — the server re-validates on create. */}
        <p className="mt-1 text-label text-fg-faint">
          Confirmed when the booking is created.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <input
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase());
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void apply(code);
            }
          }}
          placeholder="Coupon code"
          autoComplete="off"
          className="min-w-0 flex-1 rounded-lg border border-hairline bg-panel-raised px-4 py-2.5 font-mono text-body uppercase tracking-wider text-fg outline-none placeholder:font-sans placeholder:normal-case placeholder:tracking-normal placeholder:text-fg-faint focus:border-edge"
        />
        <button
          type="button"
          onClick={() => apply(code)}
          disabled={!code.trim() || checking}
          className="shrink-0 rounded-sm border border-edge px-5 py-2.5 text-body-sm font-medium text-fg transition-colors hover:bg-panel-raised disabled:opacity-50"
        >
          {checking ? "Checking…" : "Apply"}
        </button>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-body-sm text-fault">
          {error}
        </p>
      ) : null}

      {(available?.coupons ?? []).length > 0 ? (
        <div className="mt-3">
          <p className="mb-1.5 text-label font-semibold uppercase tracking-[1px] text-fg-faint">
            Available to you
          </p>
          <div className="flex flex-wrap gap-2">
            {(available?.coupons ?? []).map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => apply(c.code)}
                title={c.description ?? c.name}
                className="rounded-full border border-hairline px-3.5 py-1.5 font-mono text-body-sm font-medium text-fg-mid transition-colors hover:border-edge hover:text-fg"
              >
                {c.code}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
