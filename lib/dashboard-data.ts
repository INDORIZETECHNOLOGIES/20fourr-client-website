/**
 * Mock dashboard data, lifted verbatim from the design's DCLogic block.
 *
 * Like lib/auth.ts this is the swap seam: replace these exports with real fetches
 * and nothing in the components changes.
 */

/**
 * The ten booking statuses the production app defines
 * (SecureConnect/mobile/src/constants/clientTheme.js → bookingStatusMeta).
 *
 * The earlier three-value model (upcoming/active/completed) could not represent
 * payment state, live duty, or disputes, so every booking surface was lossy.
 */
export type BookingStatus =
  | "pending"
  | "provider_accepted"
  | "payment_pending"
  | "payment_done"
  | "duty_started"
  | "duty_ended"
  | "disputed"
  | "completed"
  | "cancelled"
  | "provider_rejected";

export type Booking = {
  /**
   * The routing key — the API looks bookings up by Mongo `_id`
   * (`Booking.findById`), not by the human reference.
   */
  id: string;
  /** What the user sees and quotes to support, e.g. "BK-2847". */
  ref?: string;
  service: string;
  /** The raw API category — drives the row's glyph and tint. */
  category?: string;
  date: string;
  time: string;
  location: string;
  guard: string;
  status: BookingStatus;
  /** Integer paise, as the backend ledger stores it. Format with lib/money.ts. */
  amountPaise: number;
  /** Completed bookings the client still owes a rating for. */
  awaitingRating?: boolean;
};

/** Semantic colors, matching production's warning / success / error tokens. */
const WARNING = { bg: "rgba(245,158,11,0.14)", color: "#f59e0b" };
const SUCCESS = { bg: "rgba(34,197,94,0.14)", color: "#22c55e" };
const ERROR = { bg: "rgba(239,68,68,0.14)", color: "#ef4444" };

export const STATUS_STYLES: Record<
  BookingStatus,
  { label: string; bg: string; color: string }
> = {
  pending: { label: "Pending", ...WARNING },
  provider_accepted: { label: "Accepted", ...WARNING },
  payment_pending: { label: "Pay Now", ...WARNING },
  payment_done: { label: "Paid", ...SUCCESS },
  duty_started: { label: "Live", ...SUCCESS },
  duty_ended: { label: "Ended", ...WARNING },
  disputed: { label: "Disputed", ...ERROR },
  completed: { label: "Done", ...SUCCESS },
  cancelled: { label: "Cancelled", ...ERROR },
  provider_rejected: { label: "Rejected", ...ERROR },
};

/**
 * Every status the API can send, so an unrecognised one is visible rather than
 * rendering as a blank chip. `provider_rejected` is the server's spelling —
 * the value the Booking model's enum actually stores.
 */
export function statusStyle(status: string) {
  return (
    STATUS_STYLES[status as BookingStatus] ?? {
      label: status.replace(/_/g, " "),
      bg: "rgba(148,163,184,0.14)",
      color: "#94a3b8",
    }
  );
}

/** The seven in-flight statuses the app groups under its "Ongoing" tab. */
export const ONGOING_STATUSES: BookingStatus[] = [
  "pending",
  "provider_accepted",
  "payment_pending",
  "payment_done",
  "duty_started",
  "duty_ended",
  "disputed",
];

export type BookingTab = "ongoing" | "completed" | "cancelled";

export const BOOKING_TABS: { id: BookingTab; label: string }[] = [
  { id: "ongoing", label: "Ongoing" },
  { id: "completed", label: "Completed" },
  { id: "cancelled", label: "Cancelled" },
];

export const BOOKINGS: Booking[] = [
  {
    id: "BK-2847",
    service: "Security Guard",
    date: "Aug 10, 2026",
    time: "09:00 AM",
    location: "Downtown Mall",
    guard: "James R.",
    status: "provider_accepted",
    amountPaise: 200000,
  },
  {
    id: "BK-2846",
    service: "Bouncer",
    date: "Aug 8, 2026",
    time: "08:00 PM",
    location: "Club Neon",
    guard: "Mike T.",
    status: "duty_started",
    amountPaise: 240000,
  },
  {
    id: "BK-2840",
    service: "PSO",
    date: "Aug 9, 2026",
    time: "07:00 AM",
    location: "Cyber Hub",
    guard: "Anil K.",
    status: "payment_pending",
    amountPaise: 560000,
  },
  {
    id: "BK-2838",
    service: "Corporate Security",
    date: "Aug 7, 2026",
    time: "09:00 AM",
    location: "Tech Park",
    guard: "Vikram S.",
    status: "disputed",
    amountPaise: 1200000,
  },
  {
    id: "BK-2831",
    service: "Event Security",
    date: "Aug 5, 2026",
    time: "06:00 PM",
    location: "Grand Arena",
    guard: "Team of 8",
    status: "completed",
    amountPaise: 9600000,
    awaitingRating: true,
  },
  {
    id: "BK-2812",
    service: "Personal Guard",
    date: "Jul 28, 2026",
    time: "10:00 AM",
    location: "Private Res.",
    guard: "Carlos M.",
    status: "completed",
    amountPaise: 1020000,
    awaitingRating: true,
  },
  {
    id: "BK-2801",
    service: "Security Guard",
    date: "Jul 20, 2026",
    time: "08:00 AM",
    location: "Office Complex",
    guard: "Raj P.",
    status: "completed",
    amountPaise: 400000,
  },
  {
    id: "BK-2795",
    service: "Bouncer",
    date: "Jul 14, 2026",
    time: "09:00 PM",
    location: "Hotel Aurum",
    guard: "Imran H.",
    status: "cancelled",
    amountPaise: 280000,
  },
];

export const RECENT_BOOKINGS = BOOKINGS.slice(0, 4);

export function bookingsByStatus(status: BookingStatus): Booking[] {
  return BOOKINGS.filter((b) => b.status === status);
}

/**
 * Tab filter, mirroring the app's MyBookings grouping.
 *
 * One deviation: the app's `cancelled` tab checks `status === 'cancelled'`
 * only, so a `provider_rejected` booking appears in no tab at all and is
 * invisible to the client. Grouping it under Cancelled here keeps it reachable.
 */
export const TAB_STATUSES: Record<BookingTab, BookingStatus[]> = {
  ongoing: ONGOING_STATUSES,
  completed: ["completed"],
  cancelled: ["cancelled", "provider_rejected"],
};

export function bookingsByTab(tab: BookingTab): Booking[] {
  return BOOKINGS.filter((b) => TAB_STATUSES[tab].includes(b.status));
}

/** Counts the dashboard stat tiles read from. */
export const BOOKING_COUNTS = {
  /** Accepted or paid but duty hasn't started. */
  upcoming: BOOKINGS.filter((b) =>
    ["pending", "provider_accepted", "payment_pending", "payment_done"].includes(b.status),
  ).length,
  /** Duty in progress right now. */
  active: BOOKINGS.filter((b) => b.status === "duty_started").length,
  awaitingRating: BOOKINGS.filter((b) => b.awaitingRating).length,
  ongoing: BOOKINGS.filter((b) => ONGOING_STATUSES.includes(b.status)).length,
};

/** Icon key resolved to a component in components/dashboard/icons.tsx. */
export type ServiceIcon =
  | "shield"
  | "crowd"
  | "pistol"
  | "ticket"
  | "police"
  | "medal"
  | "guard"
  | "building"
  | "briefcase";

export type Service = {
  name: string;
  desc: string;
  /** Starting hourly rate in integer paise. */
  fromRatePaise: number;
  bookings: number;
  icon: ServiceIcon;
  /** Tailwind text-color class for the glyph, and the tinted tile behind it. */
  color: string;
  iconBg: string;
  /** Border tint used on hover. */
  hover: string;
};

export const SERVICES: Service[] = [
  {
    name: "Security Guard",
    desc: "Professional trained security personnel for premises and perimeter protection",
    fromRatePaise: 25000,
    bookings: 142,
    icon: "shield",
    color: "text-app-gold",
    iconBg: "bg-app-gold/12",
    hover: "hover:border-app-gold/20",
  },
  {
    name: "Bouncer",
    desc: "Crowd control and access management for events, clubs and venues",
    fromRatePaise: 40000,
    bookings: 89,
    icon: "crowd",
    color: "text-app-gold",
    iconBg: "bg-app-gold/12",
    hover: "hover:border-app-gold/20",
  },
  {
    name: "Gunman",
    desc: "Licensed armed security personnel for high-risk environments",
    fromRatePaise: 90000,
    bookings: 34,
    icon: "pistol",
    color: "text-red-500",
    iconBg: "bg-red-500/12",
    hover: "hover:border-red-500/20",
  },
  {
    name: "Event Security",
    desc: "Complete security teams for concerts, conferences and large-scale events",
    fromRatePaise: 120000,
    bookings: 67,
    icon: "ticket",
    color: "text-app-info",
    iconBg: "bg-app-info/12",
    hover: "hover:border-app-info/20",
  },
  {
    name: "PSO",
    desc: "Police Service Officer",
    fromRatePaise: 70000,
    bookings: 53,
    icon: "police",
    color: "text-blue-500",
    iconBg: "bg-blue-500/12",
    hover: "hover:border-blue-500/20",
  },
  {
    name: "Ex-Servicemen",
    desc: "Ex-Servicemen security personnel for premises and perimeter protection",
    fromRatePaise: 45000,
    bookings: 53,
    icon: "medal",
    color: "text-green-500",
    iconBg: "bg-green-500/12",
    hover: "hover:border-green-500/20",
  },
  {
    name: "Personal Guard",
    desc: "Dedicated bodyguard and personal protection for individuals and families",
    fromRatePaise: 85000,
    bookings: 28,
    icon: "guard",
    color: "text-green-500",
    iconBg: "bg-green-500/12",
    hover: "hover:border-green-500/20",
  },
  {
    name: "Corporate Security",
    desc: "Comprehensive office building and corporate premises protection solutions",
    fromRatePaise: 50000,
    bookings: 53,
    icon: "building",
    color: "text-violet-400",
    iconBg: "bg-violet-400/12",
    hover: "hover:border-violet-400/20",
  }
];

/** The four services shown in the dashboard's compact list. */
export const FEATURED_SERVICES = SERVICES.slice(0, 6);

export type Address = {
  id: string;
  /** Display name for the address — "Home", "Office", "New Delhi". */
  label: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
};

/** The app caps saved addresses and shows "n/10 addresses saved". */
export const MAX_ADDRESSES = 10;

export const ADDRESSES: Address[] = [
  {
    id: "addr-1",
    label: "New Delhi",
    street: "NCR Delhi",
    city: "Delhi",
    state: "Delhi",
    pincode: "110096",
    isDefault: true,
  },
];

/** "NCR Delhi, Delhi, Delhi, 110096" — skips any parts left blank. */
export function formatAddress(a: Address): string {
  return [a.street, a.city, a.state, a.pincode].filter(Boolean).join(", ");
}


/** Client type drives GST treatment — reverse charge applies to registered businesses. */
export type ClientType = "individual" | "registered_business";

/** Preferred service category, mirroring the app's CATEGORY_OPTIONS. */
export type PreferredCategory = null | "guard" | "bouncer" | "gunman" | "pso";

export const CATEGORY_OPTIONS: { id: PreferredCategory; label: string }[] = [
  { id: null, label: "No preference" },
  { id: "guard", label: "Guard" },
  { id: "bouncer", label: "Bouncer" },
  { id: "gunman", label: "Gunman" },
  { id: "pso", label: "PSO" },
];

export const CURRENT_USER = {
  name: "Santosh",
  firstName: "Santosh",
  lastName: "Kumar",
  fullName: "Santosh Kumar",
  email: "santosh@20fourr.com",
  // Indian formatting, matching the mobile app and the signup validator.
  // Deliberately a placeholder rather than the real number in the app screenshot.
  phone: "9876543210",
  city: "New Delhi",
  address: "Tower B, Sector 62, NCR Delhi",
  /** Kept as the display string for the profile chip and invoice header. */
  location: "New Delhi",
  memberSince: "2026",

  clientType: "individual" as ClientType,
  gstin: "",
  preferredServiceCategory: null as PreferredCategory,
  preferVehicle: false,
  preferVehicleWithDriver: false,

  initial: "S",
  role: "Client Account",
  /** No photo on file — the hero falls back to the initial on a gold gradient. */
  avatarUrl: null as string | null,
  verified: true,
  walletBalancePaise: 240000,
  totalBookings: 48,
  avgRating: "4.9",
};
