/**
 * Support tickets and notifications — presentation metadata for the live API.
 *
 * The mock records are gone; these screens read the API now. What remains here
 * is the mapping the server does NOT provide: labels, tints and the category
 * copy that turns an enum value into something a client would recognise.
 */

// ─── Tickets ────────────────────────────────────────────────────────────────

/**
 * Six statuses, matching the Ticket model exactly.
 *
 * The earlier four-value model (open/pending/resolved/closed) could not say
 * *who* a ticket is waiting on, which is the single most useful thing a support
 * list can tell you — "waiting on you" is an action, "in review" is not.
 */
export type TicketStatus =
  | "open"
  | "in_review"
  | "waiting_on_customer"
  | "waiting_on_provider"
  | "resolved"
  | "closed";

/** The API's enum is low/medium/high/urgent — there is no "normal". */
export type TicketPriority = "low" | "medium" | "high" | "urgent";

/** The `type` field the API requires on every ticket. */
export type TicketType =
  | "dispute"
  | "misconduct"
  | "payment"
  | "absence"
  | "misbehaviour"
  | "quality"
  | "grievance"
  | "other";

export type TicketMessage = {
  id: string;
  from: "you" | "support";
  author: string;
  body: string;
  at: string;
};

export type Ticket = {
  /** Mongo _id — the routing key, since /tickets/:id resolves with findById. */
  id: string;
  /** Human reference, e.g. "TKT-4471". */
  ref: string;
  subject: string;
  type: TicketType;
  category: string;
  priority: TicketPriority;
  status: TicketStatus;
  updated: string;
  bookingId?: string;
  messages: TicketMessage[];
};

/**
 * Client-facing labels for the API's ticket types.
 *
 * The enum values are internal vocabulary ("misbehaviour", "absence"); these
 * are what a client would actually pick from. The id is what gets sent.
 */
export const TICKET_CATEGORIES: { id: TicketType; label: string; hint: string }[] = [
  { id: "quality", label: "Service quality", hint: "The guard didn't meet expectations" },
  { id: "absence", label: "Guard didn't arrive", hint: "No-show or left the post" },
  { id: "misconduct", label: "Provider conduct", hint: "Unprofessional behaviour on duty" },
  { id: "misbehaviour", label: "Misbehaviour", hint: "Harassment or inappropriate conduct" },
  { id: "payment", label: "Payment or refund", hint: "Charges, invoices or refunds" },
  { id: "dispute", label: "Dispute a booking", hint: "Formally contest a booking outcome" },
  { id: "grievance", label: "Formal grievance", hint: "Escalated complaint with an SLA" },
  { id: "other", label: "Something else", hint: "Anything not covered above" },
];

export function ticketCategoryLabel(type: string): string {
  return TICKET_CATEGORIES.find((c) => c.id === type)?.label ?? "Support";
}

export const TICKET_PRIORITIES: { id: TicketPriority; label: string; cls: string }[] = [
  { id: "low", label: "Low", cls: "bg-slate-500/14 text-slate-400" },
  { id: "medium", label: "Medium", cls: "bg-app-info/14 text-app-info" },
  { id: "high", label: "High", cls: "bg-app-warning/14 text-app-warning" },
  { id: "urgent", label: "Urgent", cls: "bg-red-500/14 text-red-400" },
];

export const TICKET_STATUS: Record<TicketStatus, { label: string; cls: string }> = {
  open: { label: "Open", cls: "bg-app-info/14 text-app-info" },
  in_review: { label: "In review", cls: "bg-app-info/14 text-app-info" },
  waiting_on_customer: { label: "Awaiting you", cls: "bg-app-warning/14 text-app-warning" },
  waiting_on_provider: { label: "Awaiting provider", cls: "bg-app-warning/14 text-app-warning" },
  resolved: { label: "Resolved", cls: "bg-green-500/14 text-green-500" },
  closed: { label: "Closed", cls: "bg-slate-500/14 text-slate-400" },
};

/** Never render an undefined chip if the API grows a seventh status. */
export function ticketStatusMeta(status: string) {
  return (
    TICKET_STATUS[status as TicketStatus] ?? {
      label: status.replace(/_/g, " "),
      cls: "bg-slate-500/14 text-slate-400",
    }
  );
}

export function ticketPriorityMeta(priority: string) {
  return (
    TICKET_PRIORITIES.find((p) => p.id === priority) ?? {
      id: "low" as TicketPriority,
      label: priority,
      cls: "bg-slate-500/14 text-slate-400",
    }
  );
}

/** Only an open-ish ticket can take a reply or be closed. */
export const CLOSED_TICKET_STATUSES: TicketStatus[] = ["resolved", "closed"];

// ─── Notifications ──────────────────────────────────────────────────────────

export type AppNotification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  at: string;
  read: boolean;
  href?: string;
};

type NotificationMeta = { tint: string; label: string };

const BOOKING: NotificationMeta = { tint: "bg-green-500/12 text-green-500", label: "Booking" };
const PAYMENT: NotificationMeta = { tint: "bg-app-warning/12 text-app-warning", label: "Payment" };
const ALERT: NotificationMeta = { tint: "bg-red-500/12 text-red-400", label: "Alert" };
const ACCOUNT: NotificationMeta = { tint: "bg-app-info/12 text-app-info", label: "Account" };
const SYSTEM: NotificationMeta = { tint: "bg-slate-500/12 text-slate-400", label: "System" };

/**
 * The API's `type` enum runs to about thirty values across booking, payment,
 * KYC, penalties, compliance and protection-detail ops. Only the ones a client
 * can actually receive are named; everything else falls back to System rather
 * than rendering a blank tile.
 */
export const NOTIFICATION_META: Record<string, NotificationMeta> = {
  booking_request: BOOKING,
  booking_accepted: BOOKING,
  booking_rejected: { tint: "bg-red-500/12 text-red-400", label: "Booking" },
  booking_completed: BOOKING,
  booking_cancelled: { tint: "bg-red-500/12 text-red-400", label: "Booking" },
  booking_reminder: { tint: "bg-app-info/12 text-app-info", label: "Reminder" },

  payment_success: { tint: "bg-green-500/12 text-green-500", label: "Payment" },
  payment_failed: { tint: "bg-red-500/12 text-red-400", label: "Payment" },

  penalty: ALERT,
  absence_alert: ALERT,
  rating_received: { tint: "bg-app-gold/12 text-app-gold", label: "Rating" },

  profile_update: ACCOUNT,
  account_warning: ALERT,
  account_blocked: ALERT,
  account_unblocked: ACCOUNT,

  support_ticket: { tint: "bg-app-info/12 text-app-info", label: "Support" },

  // Protection-detail ops — these are safety-critical, so they read as alerts.
  sos_alert: ALERT,
  incident_reported: ALERT,
  geofence_breach: ALERT,

  system: SYSTEM,
  system_update: SYSTEM,
  system_announcement: SYSTEM,
};

export function notificationMeta(kind: string): NotificationMeta {
  return NOTIFICATION_META[kind] ?? SYSTEM;
}

/**
 * The client app's own FAQs, verbatim from
 * screens/client/support/SupportHomeScreen.js.
 *
 * These were four invented questions with the answer "Answer copy pending" —
 * so the section looked finished and told the user nothing. Answers here are
 * the app's, which means the two surfaces state the same policy: notably the
 * 24-hour cancellation window and the 30/70 payment split, both of which a
 * client could otherwise be told two different things about.
 */
export const FAQS: { q: string; a: string }[] = [
  {
    q: "How do I book a service?",
    a: "Navigate to Home, select a category, find a provider, and follow the booking flow.",
  },
  {
    q: "Can I cancel my booking?",
    a: "Yes — up to 24 hours before the service starts without penalty.",
  },
  {
    q: "How are payments processed?",
    a: "30% upfront (released at duty-start OTP) and 70% after completion within 2 business days.",
  },
  {
    q: "What if I need to change dates?",
    a: "Contact support within 48 hours of booking to request a change.",
  },
];
