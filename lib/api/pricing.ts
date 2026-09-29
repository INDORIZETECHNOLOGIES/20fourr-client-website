import type { BookingDraft } from "@/app/book/BookingContext";
import type { ApiBooking, ApiPublicProvider, Quote, QuoteLine, RangePricing } from "@/lib/api/types";

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
  /** Rendered as a ruled subtotal row. */
  subtotal?: boolean;
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

function isV6Payload(obj: Record<string, unknown>): boolean {
  if (obj.billingEngine === "v6") return true;
  return Array.isArray(obj.lines) && typeof obj.clientTotalPaise === "number";
}

function asQuote(obj: Record<string, unknown>): Quote {
  const lines = Array.isArray(obj.lines) ? (obj.lines as QuoteLine[]) : [];
  const range = asRecord(obj.rangePricing);
  return {
    billingEngine: typeof obj.billingEngine === "string" ? obj.billingEngine : "v6",
    currency: typeof obj.currency === "string" ? obj.currency : undefined,
    lines,
    clientTotalPaise: asNumber(obj.clientTotalPaise),
    headcount: typeof obj.headcount === "number" ? obj.headcount : undefined,
    unitProviderPricePaise: typeof obj.unitProviderPricePaise === "number" ? obj.unitProviderPricePaise : undefined,
    vehicleChargesPaise: typeof obj.vehicleChargesPaise === "number" ? obj.vehicleChargesPaise : undefined,
    rangePricing: range ? (range as unknown as RangePricing) : null,
    paymentPath: obj.paymentPath === "contract" ? "contract" : obj.paymentPath === "upfront" ? "upfront" : undefined,
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

/**
 * The client-facing shape, as the business specified it:
 *
 *   Service charge (base price)   100
 *   Vehicle charge                  (only when a vehicle was booked)
 *   Platform fee                   15
 *   Total                         115
 *   GST 18%                     20.70
 *   (To be paid — rendered by the caller from the quote total)
 *
 * GST is shown as ONE line, but it is the sum of the two GST lines the server
 * charged (service GST + platform fee GST), never recomputed here — the two
 * are rounded separately and go on two separate invoices, so recomputing 18%
 * of the subtotal could disagree with what is charged by a paisa.
 *
 * An unregistered provider charges no GST on the service, so there the single
 * line is GST on the platform fee only, and is labelled as such.
 *
 * The server's `service` line already includes the vehicle (backend: provider pre-GST price =
 * unit price × headcount + vehicle). Left folded in, a vehicle just made "Service charge" bigger
 * and read as not charged at all, so it is split back out from `vehicleChargesPaise`.
 */
export function toDisplayLines(quote: PriceQuote): DisplayLine[] {
  if (quote.engine === "v6") {
    const lines = quote.quote.lines;
    const byKey = (key: string) => lines.find((line) => line.key === key);
    const service = byKey("service")?.amountPaise ?? quote.quote.providerPreGstPaise ?? 0;
    const vehicle = Math.min(Math.max(quote.quote.vehicleChargesPaise ?? 0, 0), service);
    const fee = byKey("platformFee")?.amountPaise ?? quote.quote.platformFeePaise ?? 0;
    const serviceGstLine = byKey("serviceGst");
    const feeGstLine = byKey("platformGst");
    const serviceGst = serviceGstLine?.amountPaise ?? quote.quote.serviceGstPaise ?? 0;
    const feeGst = feeGstLine?.amountPaise ?? quote.quote.platformGstPaise ?? 0;
    const rate = feeGstLine?.ratePct ?? serviceGstLine?.ratePct ?? 18;

    const headcount = quote.quote.headcount ?? 1;
    return [
      {
        label: headcount > 1 ? `Service charge (${headcount} people)` : "Service charge (base price)",
        amountPaise: service - vehicle,
        note: serviceBasisNote(quote.quote.rangePricing ?? null, headcount),
      },
      ...(vehicle > 0 ? [{ label: "Vehicle charge", amountPaise: vehicle }] : []),
      { label: "Platform fee", amountPaise: fee },
      { label: "Total", amountPaise: service + fee, subtotal: true },
      {
        label: serviceGst > 0 ? `GST ${rate}%` : `GST ${rate}% on platform fee`,
        amountPaise: serviceGst + feeGst,
      },
    ];
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

const plural = (n: number, one: string) => `${n} ${one}${n === 1 ? "" : "s"}`;

/**
 * How a multi-day booking was priced, in words — the basis the server chose (backend spec 0013),
 * never recomputed here. Undefined for a single day, which needs no explanation.
 */
export function serviceBasisNote(range: RangePricing | null, headcount: number): string | undefined {
  const perPerson = headcount > 1 ? " per person" : "";
  if (!range) return undefined;
  if (range.basis === "package") {
    const parts = [
      range.yearlyBlocks ? plural(range.yearlyBlocks, "year") : "",
      range.monthlyPeriods ? plural(range.monthlyPeriods, "month") : "",
      range.remainderDays ? plural(range.remainderDays, "day") : "",
    ].filter(Boolean);
    const basis = range.yearlyBlocks ? "Yearly package" : "Monthly package";
    return `${basis}${perPerson}: ${parts.join(" + ")}, cheaper than ${plural(range.days, "day")} at the daily rate`;
  }
  return `Daily rate${perPerson} × ${plural(range.days, "day")}`;
}

/**
 * The schedule the API is sent — one window for the price preview and the booking, so they
 * can never disagree. "For business" off: one shift starting on `date`. On: the same daily
 * shift on every day from `date` to `endDate` (the backend prices a range as that).
 * An overnight shift ends on the calendar day after its start, for a range as for one day.
 */
export function scheduleWindow(
  draft: Pick<BookingDraft, "date" | "startTime" | "hours" | "forBusiness" | "endDate">,
): { startDate: string; startTime: string; endDate: string; endTime: string } | null {
  const end = endOfShift(draft.date, draft.startTime, draft.hours);
  if (!end) return null;
  if (!draft.forBusiness || !draft.endDate) {
    return { startDate: draft.date, startTime: draft.startTime, endDate: end.endDate, endTime: end.endTime };
  }
  const overnight = end.endDate !== draft.date;
  return {
    startDate: draft.date,
    startTime: draft.startTime,
    endDate: overnight ? addDays(draft.endDate, 1) : draft.endDate,
    endTime: end.endTime,
  };
}

/** Calendar days from `start` to `end`, both included. Null when the range is backwards. */
export function daysInRange(start: string, end: string): number | null {
  if (!start || !end) return null;
  const ms = Date.parse(`${end}T00:00:00Z`) - Date.parse(`${start}T00:00:00Z`);
  if (Number.isNaN(ms) || ms < 0) return null;
  return Math.round(ms / 86_400_000) + 1;
}

function addDays(date: string, n: number): string {
  const d = new Date(Date.parse(`${date}T00:00:00Z`) + n * 86_400_000);
  return d.toISOString().slice(0, 10);
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
  const slot = scheduleWindow(draft);
  if (!draft.providerId || !draft.serviceCategory || !slot) return null;
  const deploymentState = draft.deployment.stateName.trim();
  if (!deploymentState) return null;
  const deploymentCity = (draft.deployment.city || draft.city || "").trim();

  return {
    serviceCategory: draft.serviceCategory,
    ...slot,
    vehicleOption: draft.vehicleOption,
    /** State name, never a code — controller uses stateCodeFromName(). */
    deploymentState,
    // Spec 0012: without it the preview prices at the provider's primary city, while the booking
    // itself prices at the deployment city — two different rate rows, two different totals.
    ...(deploymentCity ? { deploymentCity } : {}),
    // Sent only above one, so a single booking's request is exactly what it was before.
    ...(draft.headcount > 1 ? { headcount: String(draft.headcount) } : {}),
  };
}

export type VehicleChoice = "vehicle" | "vehicleWithDriver";

/**
 * What each vehicle option costs per day with this provider, in paise; null when it isn't offered.
 *
 * Mirrors the backend's rule (booking.service calculateBookingAmount): a vehicle is charged only
 * when the provider has `offersVehicle` on AND the rate row that prices the booking has a non-zero
 * rate for that option. Anything else is quietly charged ₹0, so the funnel must not offer it.
 * The backend checks `offersVehicle` for both options, never `offersVehicleWithDriver`, and so
 * does this.
 *
 * The row is the deployment city's, else the provider's unscoped row. When neither matches by
 * name (the server also knows city aliases this can't), any row for the category counts, and the
 * price preview's `vehicleChargesPaise` has the final word.
 */
export function vehicleDailyRates(
  provider: Pick<ApiPublicProvider, "pricing" | "vehicleOptions"> | null | undefined,
  category: string | null,
  city: string,
): Record<VehicleChoice, number | null> {
  const none = { vehicle: null, vehicleWithDriver: null };
  if (!provider?.vehicleOptions?.offersVehicle || !category) return none;
  const rows = (provider.pricing ?? []).filter((r) => r.category === category);
  const name = city.trim().toLowerCase();
  const row =
    (name && rows.find((r) => r.cityName?.trim().toLowerCase() === name)) || rows.find((r) => !r.cityKey);
  const pick = (rate: (r: (typeof rows)[number]) => number | null | undefined) => {
    const candidates = row ? [row] : rows;
    const found = candidates.map(rate).find((v) => typeof v === "number" && v > 0);
    return found ?? null;
  };
  return { vehicle: pick((r) => r.vehicleRate), vehicleWithDriver: pick((r) => r.vehicleWithDriverRate) };
}
