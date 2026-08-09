"use client";

import { useApiQuery } from "@/hooks/useApiQuery";
import type { BookingDraft } from "@/app/book/BookingContext";

/**
 * Booking price, from the server.
 *
 * THIS REPLACED A LOCAL CALCULATION. `lib/booking-data.ts` used to derive the
 * total as base + 5% convenience + 18% GST, which was a guess. The server's
 * `calculateBookingAmount` applies the provider's own daily/hourly rates,
 * decides between hourly and per-day billing, adds vehicle charges, and splits
 * the payout — none of which the browser can reproduce.
 *
 * A quoted price that disagrees with the server is not a rounding nit: the
 * client sees one number on the confirm screen and a different one on the
 * Razorpay sheet. The preview endpoint is the single source of truth, and every
 * screen that shows money in the funnel reads it.
 */

export type PricePreview = {
  /** Every amount is integer paise — format with lib/money.ts. */
  baseAmount: number;
  platformFee: number;
  gstAmount: number;
  totalAmount: number;
  providerPayout: number;
  totalHours: number;
  numberOfDays: number;
  /** True when the provider's hourly rate was used rather than the daily one. */
  isHourlyBilling: boolean;
  hourlyRate: number | null;
  dailyRate: number | null;
};

/**
 * The funnel collects a start and a duration; the API wants an explicit end.
 * Rolls over midnight, so an 8-hour shift from 22:00 ends 06:00 the next day.
 */
export function endOfShift(
  date: string,
  startTime: string,
  hours: number,
): { endDate: string; endTime: string } | null {
  if (!date || !startTime || !hours) return null;

  const start = new Date(`${date}T${startTime}:00`);
  if (Number.isNaN(start.getTime())) return null;

  const end = new Date(start.getTime() + hours * 3_600_000);
  const pad = (n: number) => String(n).padStart(2, "0");

  return {
    endDate: `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())}`,
    endTime: `${pad(end.getHours())}:${pad(end.getMinutes())}`,
  };
}

/** The exact query the preview endpoint needs, or null when the draft isn't ready. */
export function previewQuery(draft: BookingDraft) {
  const end = endOfShift(draft.date, draft.startTime, draft.hours);
  if (!draft.providerId || !draft.serviceCategory || !end) return null;

  return {
    serviceCategory: draft.serviceCategory,
    startDate: draft.date,
    startTime: draft.startTime,
    endDate: end.endDate,
    endTime: end.endTime,
    vehicleOption: draft.vehicleOption,
  };
}

export function usePricePreview(draft: BookingDraft) {
  const query = previewQuery(draft);

  return useApiQuery<PricePreview>(
    draft.providerId ? `client/providers/${draft.providerId}/price-preview` : null,
    { query: query ?? undefined, enabled: Boolean(query) },
  );
}
