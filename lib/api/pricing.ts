import type { BookingDraft } from "@/app/book/BookingContext";
import type { ApiBooking, Quote, QuoteLine } from "@/lib/api/types";

/**
 * Booking price, from the server.
 *
 * THIS REPLACED A LOCAL CALCULATION. `lib/booking-data.ts` used to derive the
 * total as base + 5% convenience + 18% GST, which was a guess. The server's
 * calculator applies the provider's own rates, vehicle charges, and (on v6) a
 * stored quote — none of which the browser can reproduce.
 *
 * Spec 0002 owns this union. Spec 0001 owns how the lines look.
 */

export type V1PricePreview = {
  /** Every amount is integer paise — format with lib/money.ts. */
  baseAmount: number;
  platformFee: number;
  gstAmount: number;
  totalAmount: number;
  totalHours: number;
  numberOfDays: number;
  /** True when the provider's hourly rate was used rather than the daily one. */
  isHourlyBilling: boolean;
  hourlyRate: number | null;
  dailyRate: number | null;
};

/** @deprecated Use PriceQuote. Kept as an alias of the v1 payload shape. */
export type PricePreview = V1PricePreview;

export type PriceQuote =
  | { engine: "v1"; v1: V1PricePreview }
  | { engine: "v6"; quote: Quote };

export type DisplayLine = {
  label: string;
  amountPaise: number;
  note?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function asNumber(value: unknown, fallback = 0): number {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function gstNote(line: QuoteLine): string | undefined {
  if (!line.split) return undefined;
  if (line.split.intraState) {
    const half = line.ratePct != null ? `${line.ratePct / 2}%` : "";
    return half ? `CGST ${half} · SGST ${half}` : "CGST · SGST";
  }
  return line.ratePct != null ? `IGST ${line.ratePct}%` : "IGST";
}

function isV6Payload(obj: Record<string, unknown>): boolean {
  if (obj.billingEngine === "v6") return true;
  return Array.isArray(obj.lines) && typeof obj.clientTotalPaise === "number";
}

function asQuote(obj: Record<string, unknown>): Quote {
  const lines = Array.isArray(obj.lines) ? (obj.lines as QuoteLine[]) : [];
  return {
    billingEngine: typeof obj.billingEngine === "string" ? obj.billingEngine : "v6",
    currency: typeof obj.currency === "string" ? obj.currency : undefined,
    lines,
    clientTotalPaise: asNumber(obj.clientTotalPaise),
  };
}

function asV1(obj: Record<string, unknown>): V1PricePreview {
  return {
    baseAmount: asNumber(obj.baseAmount),
    platformFee: asNumber(obj.platformFee),
    gstAmount: asNumber(obj.gstAmount),
    totalAmount: asNumber(obj.totalAmount),
    totalHours: asNumber(obj.totalHours),
    numberOfDays: asNumber(obj.numberOfDays),
    isHourlyBilling: Boolean(obj.isHourlyBilling),
    hourlyRate: typeof obj.hourlyRate === "number" ? obj.hourlyRate : null,
    dailyRate: typeof obj.dailyRate === "number" ? obj.dailyRate : null,
  };
}

export function tagPriceQuote(raw: unknown): PriceQuote {
  const root = asRecord(raw) ?? {};
  const nested = asRecord(root.quote);

  if (isV6Payload(root)) return { engine: "v6", quote: asQuote(root) };
  if (nested && isV6Payload(nested)) return { engine: "v6", quote: asQuote(nested) };
  if (root.billingEngine === "v6" && nested) return { engine: "v6", quote: asQuote(nested) };

  return { engine: "v1", v1: asV1(root) };
}

export function quoteFromBooking(booking: ApiBooking): PriceQuote | null {
  if (booking.quote && Array.isArray(booking.quote.lines) && typeof booking.quote.clientTotalPaise === "number") {
    return { engine: "v6", quote: booking.quote };
  }
  if (booking.billingEngine === "v6" && booking.quote) {
    return { engine: "v6", quote: booking.quote };
  }

  const total = booking.totalAmount;
  const base = booking.baseAmount;
  const fee = booking.platformFee;
  const gst = booking.gstAmount;
  if (total == null && base == null && fee == null && gst == null) return null;

  return {
    engine: "v1",
    v1: {
      baseAmount: base ?? 0,
      platformFee: fee ?? 0,
      gstAmount: gst ?? 0,
      totalAmount: total ?? 0,
      totalHours: booking.totalHours ?? 0,
      numberOfDays: booking.numberOfDays ?? 0,
      isHourlyBilling: Boolean(booking.totalHours && !booking.isFullDay),
      hourlyRate: null,
      dailyRate: null,
    },
  };
}

export function quoteTotalPaise(quote: PriceQuote): number {
  return quote.engine === "v6" ? quote.quote.clientTotalPaise : quote.v1.totalAmount;
}

export function quotePlatformFeePaise(quote: PriceQuote): number {
  if (quote.engine === "v1") return quote.v1.platformFee;
  // Match the stable key, not the display label: the label is copy ("20fourr
  // Platform Fee") and a wording change would silently return 0 here.
  const line = quote.quote.lines.find((item) => item.key === "platformFee");
  return line?.amountPaise ?? quote.quote.platformFeePaise ?? 0;
}

export function toDisplayLines(quote: PriceQuote): DisplayLine[] {
  if (quote.engine === "v6") {
    return quote.quote.lines.map((line) => ({
      label: line.label,
      amountPaise: line.amountPaise,
      note: gstNote(line),
    }));
  }

  const v1 = quote.v1;
  const basis = v1.isHourlyBilling
    ? `Hourly rate × ${v1.totalHours}h`
    : `Daily rate × ${v1.numberOfDays} day${v1.numberOfDays === 1 ? "" : "s"}`;

  const named = v1.baseAmount + v1.platformFee + v1.gstAmount;
  const remainder = v1.totalAmount - named;

  const lines: DisplayLine[] = [];

  if (v1.baseAmount || v1.platformFee || v1.gstAmount) {
    lines.push({ label: basis, amountPaise: v1.baseAmount });
    lines.push({ label: "Platform fee", amountPaise: v1.platformFee });
    lines.push({ label: "GST on platform fee", amountPaise: v1.gstAmount });
  } else if (v1.totalAmount) {
    lines.push({
      label: "Amount (line items were not stored on this booking)",
      amountPaise: v1.totalAmount,
    });
  }

  // v1 only — the endpoint under-reports named fields. Spec 0002 keeps this
  // remainder honest rather than hiding it as "GST & other charges".
  if (remainder !== 0 && (v1.baseAmount || v1.platformFee || v1.gstAmount)) {
    lines.push({
      label: "Other charges (not itemized on this quote)",
      amountPaise: remainder,
    });
  }

  return lines;
}

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
  const deploymentState = draft.deployment.stateName.trim();
  if (!deploymentState) return null;

  return {
    serviceCategory: draft.serviceCategory,
    startDate: draft.date,
    startTime: draft.startTime,
    endDate: end.endDate,
    endTime: end.endTime,
    vehicleOption: draft.vehicleOption,
    /** State name, never a code — controller uses stateCodeFromName(). */
    deploymentState,
  };
}
