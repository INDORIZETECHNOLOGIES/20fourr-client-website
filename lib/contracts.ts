import type { BookingDraft } from "@/app/book/BookingContext";
import { scheduleWindow } from "@/lib/api/pricing";
import type { ApiContract, ContractStatus, MandateMethod } from "@/lib/api/types";

/**
 * Backend spec 0014 in the client's words. Nothing here computes money: every amount is read
 * from the contract, its cycles or the quote, in paise, and formatted with lib/money.ts.
 */

const ATTENTION = { className: "border-attention text-attention", rail: "bg-attention" };
const LIVE = { className: "border-live text-live", rail: "bg-live" };
const FAULT = { className: "border-fault text-fault", rail: "bg-fault" };
const NEUTRAL = { className: "border-hairline text-fg-mid", rail: "bg-hairline" };

type Style = { label: string; className: string; rail: string };

export const CONTRACT_STATUS: Record<ContractStatus, Style> = {
  requested: { label: "Waiting for provider", ...ATTENTION },
  accepted: { label: "Pay to start", ...ATTENTION },
  active: { label: "Active", ...LIVE },
  suspended: { label: "Paused, unpaid", ...FAULT },
  completed: { label: "Completed", ...NEUTRAL },
  rejected: { label: "Declined", ...FAULT },
  cancelled: { label: "Cancelled", ...NEUTRAL },
  terminated: { label: "Ended", ...NEUTRAL },
};

export function contractStatus(status: string): Style {
  return CONTRACT_STATUS[status as ContractStatus] ?? { label: status.replace(/_/g, " "), ...NEUTRAL };
}

/** Accepted, active or suspended: the states that still bill (the service's LIVE set). */
export function isLiveContract(c: Pick<ApiContract, "status">): boolean {
  return c.status === "accepted" || c.status === "active" || c.status === "suspended";
}

export const MANDATE_METHOD_LABEL: Record<MandateMethod, string> = {
  emandate: "Bank mandate (eNACH)",
  upi: "UPI Autopay",
  card: "Card",
};

/** "eNACH", "eNACH, UPI or card" — for a sentence. */
export function mandateMethodList(methods: MandateMethod[]): string {
  const short = methods.map((m) => (m === "emandate" ? "eNACH" : m === "upi" ? "UPI" : "card"));
  return short.length > 1 ? `${short.slice(0, -1).join(", ")} or ${short[short.length - 1]}` : (short[0] ?? "");
}

export function mandateSummary(m: ApiContract["mandate"]): string {
  const how = m.method ? MANDATE_METHOD_LABEL[m.method] : "Autopay";
  switch (m.status) {
    case "confirmed":
      return `${how} is on. Each month is charged a few days before it starts.`;
    case "pending":
      return `${how} is waiting for your bank to confirm. That can take a few days; until then, pay each month here.`;
    case "rejected":
      return `Your bank declined the ${how.toLowerCase()}. Set it up again, or pay each month here.`;
    case "cancelled":
      return "Autopay is off. Pay each month here.";
    default:
      return "Autopay isn't set up. Pay each month here, or set up autopay so it's charged for you.";
  }
}

/** What a cycle's booking status means for the month, in the contract's terms. */
export function cycleState(status: string | null): { label: string; className: string } {
  switch (status) {
    case null:
      return { label: "Scheduled", className: "text-fg-faint" };
    case "provider_accepted":
    case "payment_pending":
      return { label: "Due", className: "text-attention" };
    case "payment_done":
      return { label: "Paid", className: "text-live" };
    case "duty_started":
      return { label: "In service", className: "text-live" };
    case "duty_ended":
    case "completed":
      return { label: "Done", className: "text-fg-mid" };
    case "cancelled":
      return { label: "Not billed", className: "text-fg-faint" };
    default:
      return { label: status.replace(/_/g, " "), className: "text-fg-mid" };
  }
}

const DAY_FMT = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const SHORT_FMT = new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", timeZone: "UTC" });

/** "2026-11-17" → "17 Nov 2026". Calendar days are formatted as UTC so no timezone shifts them. */
export function formatDay(day: string | null | undefined, short = false): string {
  if (!day) return "—";
  const d = new Date(`${day.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return day;
  return (short ? SHORT_FMT : DAY_FMT).format(d);
}

/** "17 Nov – 16 Dec 2026", or "17 Nov 2026 – 16 Mar 2027" when the range crosses a year. */
export function formatRange(start: string, end: string): string {
  const sameYear = start.slice(0, 4) === end.slice(0, 4);
  return `${formatDay(start, sameYear)} – ${formatDay(end)}`;
}

/**
 * The body POST /contracts/quote and POST /contracts both take, from the booking draft.
 *
 * The daily shift comes from scheduleWindow, as for the booking preview. The dates don't: a
 * contract's `endDate` is the last day of service, which the cycles are planned to, whereas a
 * booking window ending after midnight runs to the day after. Contracts carry no vehicle (0014
 * build decision 13), so none is sent.
 */
export function contractRequest(draft: BookingDraft) {
  const slot = scheduleWindow(draft);
  if (!draft.providerId || !draft.serviceCategory || !slot || !draft.endDate) return null;
  return {
    providerId: draft.providerId,
    serviceCategory: draft.serviceCategory,
    headcount: draft.headcount,
    startDate: draft.date,
    endDate: draft.endDate,
    startTime: slot.startTime,
    endTime: slot.endTime,
    deployment: {
      addressLine: (draft.deployment.addressLine || draft.address).trim(),
      city: (draft.deployment.city || draft.city || "").trim(),
      stateName: draft.deployment.stateName,
      pincode: draft.deployment.pincode || undefined,
    },
  };
}
